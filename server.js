require("dotenv").config();
const conn = require("./controllers/connecttoDB");

const PORT = process.env.PORT || 3000;
const milkPrice = process.env.MILKPRICE || 140;
conn(process.env.DB_URL);


const express = require("express");
const moment = require('moment');
const curdate = require("./controllers/currentdate");
const path = require("path")
const session = require('express-session');
const cookieParser = require("cookie-parser");
const User = require("./models/users");
const Submission = require("./models/dailyRecord");
const MonthlyReport = require("./models/monthlyRecord")

const { verifyUser } = require("./controllers/verifyUser");
const { saveUserToDb } = require("./controllers/saveUser");
const { setUser , getUser } = require("./service/auth");
const { restriction } = require("./middlewares/restriction");
const { sendOtpEmail, sendpassOTPEmail, sendpassUpdEmail} = require("./service/nodemailer");

function formatDateToPKR(date) {
    return new Date(date).toLocaleDateString('en-GB', {
         timeZone: 'Asia/Karachi',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',  
    });
}

function formatDateToYMD(date) {
            const d = new Date(date);
            const year = d.getFullYear();
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            const day = d.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
}

function convertToMonthYear(monthYear) {
    const monthNames = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
    ];

    const [monthName, year] = monthYear.split(" ");
    
    const monthIndex = monthNames.indexOf(monthName);

    const month = (monthIndex + 1).toString().padStart(2, '0');
    
    return `${month}-${year}`;
}

function formatMonth(monthYear) {
    const [month, year] = monthYear.split('-');
    
    const date = new Date(`${year}-${month}-01`);

    const monthNames = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
    ];

    const monthName = monthNames[date.getMonth()];

    return `${monthName} ${year}`;
}

function formatToDatabaseMonth(monthName, year) {
    const monthNames = {
        "January": "01", "February": "02", "March": "03", "April": "04", "May": "05", "June": "06",
        "July": "07", "August": "08", "September": "09", "October": "10", "November": "11", "December": "12"
    };

    const monthNumber = monthNames[monthName];

    if (monthNumber) {
        return `${monthNumber}-${year}`;
    } else {
        return null;
    }
}




const app = express();

app.set("view engine" , "ejs");
app.set("views" , "./views")

const oneMonth = 30 * 24 * 60 * 60 * 1000;

app.use(session({
    secret: 'your-secret-ke',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: oneMonth } 
}));

app.use(cookieParser());
app.use("/home" , restriction);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({extended : true}))
app.use(express.json());

app.get("/", async (req, res) => {

    try {
        const entry = await Submission.findOne({ date: curdate() });
        const encodedDate = encodeURIComponent(curdate());
        if ( req.cookies.role === "user" ){
                    return res.redirect("/view");
        }else{
            if (entry) {
            res.render("insertedHome", { 
                msg: `Record against date ${curdate()} already exists`, 
                username: req.cookies.name, 
                date: curdate(), 
                link: encodedDate, 
                insertion: true 
            });
        } else {
            res.redirect("/home");
        }
        }
    } catch (err) {
        console.error('Error fetching entry:', err);
        res.status(500).send('Error fetching entry');
    }
});


app.get('/view', async (req, res) => {
    const entries = await Submission.find();
    const currentDate = curdate();
    res.render('reterive', { entries: entries , date : currentDate , username : req.cookies.name , role : req.cookies.role });
});

app.post('/submit', async (req, res) => {
    const morningMilk = req.body.morningMilk;
    const eveningMilk = req.body.eveningMilk;

    const expenses = req.body.expenses;
    const revenues = req.body.revenues;

    const expensesArray = Object.values(expenses || {});
    const revenuesArray = Object.values(revenues || {});

    expensesArray.forEach((val) => {
        val.amount = +val.amount;
    });

    revenuesArray.forEach((val) => {
        val.amount = +val.amount;
    });

    const milkRevenue = (+morningMilk + +eveningMilk) * milkPrice;

    const totalExpenses = expensesArray.reduce((sum, expense) => sum + expense.amount, 0);
    const totalRevenue = revenuesArray.reduce((sum, revenue) => sum + revenue.amount, 0) + milkRevenue;
    const balance = totalRevenue - totalExpenses;

    const currentDate = curdate();

    const newSubmission = new Submission({
        date: currentDate,
        morningMilkQuantity: morningMilk,
        eveningMilkQuantity: eveningMilk,
        milkPrice: milkPrice,
        expenses: expensesArray,
        revenues: revenuesArray,
        totalRevenue: totalRevenue,
        totalExpenditure: totalExpenses,
        Balance: balance,
    });

    const [day, month, year] = currentDate.split('/');  
    const entryDateObj = new Date(year, month - 1, day);
    const currentMonth = entryDateObj.getMonth() + 1; 
    const currentYear = entryDateObj.getFullYear();
    const currentMonthStr = `${String(currentMonth).padStart(2, '0')}-${currentYear}`;

    let previousMonthStr;
    if (currentMonth === 1) {
        previousMonthStr = `12-${currentYear - 1}`;
    } else {
        previousMonthStr = `${String(currentMonth - 1).padStart(2, '0')}-${currentYear}`;
    }

    const previousMonthReport = await MonthlyReport.findOne({ month: previousMonthStr });
    const previousMonthClosingBalance = previousMonthReport ? previousMonthReport.closingBalance : 0;

    let currentMonthReport = await MonthlyReport.findOne({ month: currentMonthStr });

    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate   = new Date(currentYear, currentMonth, 0);

    const startDateFormatted = startDate.toLocaleDateString('en-GB', options);
    const endDateFormatted = endDate.toLocaleDateString('en-GB', options);

    if (!currentMonthReport) {
        currentMonthReport = new MonthlyReport({
            month: currentMonthStr,
            openingBalance: previousMonthClosingBalance, 
            netBalance: balance, 
            closingBalance: previousMonthClosingBalance + balance,
            startDate: startDateFormatted,
            endDate: endDateFormatted,
        });
        await currentMonthReport.save();
    } else {
        currentMonthReport.netBalance += balance;
        currentMonthReport.closingBalance = currentMonthReport.openingBalance + currentMonthReport.netBalance; 
        await currentMonthReport.save() 
    }
    try {
        await newSubmission.save();
        res.render("insertedHome" , { msg : `Record successfully inserted against date ${currentDate}`, 
        username : req.cookies.name , date : currentDate , insertion : null})
    } catch (error) {
        console.error('Error submitting form:', error);
        res.status(500).send('Error submitting form');
    }

});

app.get("/contact" , (req , res) => {
    res.render("contactdev" , { role : req.cookies.role})
})

app.get("/signup" , (req , res) => {
    res.render("signup" , { error : null });
})

app.post("/signup", async (req, res) => {
    try {
        const { name, password, email } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render("signup.ejs", { error: "Email already exists. Try logging in." });
        } 
        const otp = Math.floor(100000 + Math.random() * 900000);
        await sendOtpEmail(email, name, otp);

        // const hash = await bcrypt.hash(password , 10);
        
        req.session.otp = otp;
        req.session.name = name;
        req.session.email = email;
        req.session.password = password;
        
        res.render("verification" , { error : null});
    } catch (err) {
        console.log("Something went Wrong!" , err);
        res.render("signup.ejs", { error: "Something went Wrong! Try Again." });
    }
});

app.get("/login", (req, res) => {
    const userUid = req.cookies?.tId;
    if (userUid) {
        return res.redirect("/home"); 
    }
    res.render("login.ejs" , {error : null});
});

// app.post("/login" , async (req,res) => {
    
//     const { email , password } = req.body;
//     const user = await verifyUser(email , password);
//     if (user){
//         const token = setUser(user);
//         const oneMonth = 30 * 24 * 60 * 60 * 1000;
        
//         res.cookie("tId", token, { expires: new Date(Date.now() + oneMonth), httpOnly: true });
//         const userUid = req.cookies?.tId;

//     if (userUid) {
//         try {
//             const jwtToken = await getUser(userUid);
//             if (jwtToken && jwtToken.name) {
//                 username = jwtToken.name;
//             } else {
//                 console.log('JWT token missing name field.');
//             }
//         } catch (err) {
//             console.error('Error getting user:', err);
//             return res.status(500).send('Error decoding user token');
//         }
//     }
//     console.log(username)
//         try {
//             const entry = await Submission.findOne({ date: curdate() });
//             const encodedDate = encodeURIComponent(curdate());

//             if (entry) {
//                 res.render("insertedHome", { 
//                     msg: `Record against date ${curdate()} already exists`, 
//                     username: username, 
//                     date: curdate(), 
//                     link: encodedDate, 
//                     insertion: true 
//                 });
//             } else {
//                 res.redirect("/home");
//             }
//         } catch (err) {
//             console.error('Error fetching entry:', err);
//             res.status(500).send('Error fetching entry');
//         }
//     }else {
//         res.render("login" , { error : "Invalid Credentials!"})
//     }
// });

app.post("/login" , async (req,res) => {
    const { email , password } = req.body;
    const user = await verifyUser(email , password);
    if (user){
        const token = setUser(user);
        const oneMonth = 30 * 24 * 60 * 60 * 1000;
        res.cookie("tId", token, { expires: new Date(Date.now() + oneMonth), httpOnly: true });
        res.cookie("role", user.role, { expires: new Date(Date.now() + oneMonth), httpOnly: true });
        res.cookie("name", user.name, { expires: new Date(Date.now() + oneMonth), httpOnly: true });

        res.redirect("/home")
    }else {
        res.render("login" , { error : "Invalid Credentials!"})
    }
});

app.get("/verify" , (req , res) => {
    res.render("verification" , { error : null });
})

app.post("/verify", async (req, res) => {
    try {
        const { randomId } = req.body;
        if (randomId == req.session.otp) {
            await saveUserToDb(req.session.name, req.session.email, req.session.password);
            res.render("login.ejs", { error: null });
        } else {
            res.render("verification.ejs", { error: "Invalid Random ID" });
        }
    } catch (err) {
        console.log("Verification failed:", err);
        res.render("verification.ejs", { error: "Verification failed. Try again." });
    }finally{
        delete req.session.otp;
        delete req.session.name;
        delete req.session.email;
        delete req.session.hash;
    }
});

app.get("/mailforUpdate" , (req , res) => {
    res.render("mailforUpdate" , { error : null});
})

app.post("/mailforUpdate" , async (req , res) => {
    const { email } = req.body;
    const user = await User.findOne({ email : email});
    
    if (!user){
        res.render("mailforUpdate" , { error : "The Account with the give mail is not Found!"});
    }else{
        const userName = user.name; 
        const verifyOtp = Math.floor(100000 + Math.random() * 900000);
        await sendpassOTPEmail(email, userName , verifyOtp);

        req.session.verifyOtp = verifyOtp;
        req.session.userName = userName;
        req.session.email = email;
        res.render("otpforUpdate" , { error : null });
    }
});

app.post("/passOTPverify", async (req, res) => {
        const { OTP } = req.body;
        if (OTP == req.session.verifyOtp) {
            res.render("newPassword", { error: null });
        } else {
            res.render("otpforUpdate", { error: "Invalid OTP! Try Again!" });
            
        }
});

app.post("/updatepass" , async (req , res) => {
    const { pass1 , pass2 } = req.body;
    if ( pass1 !== pass2 ){
        res.render("newPassword", { error: "Password and Confirm Password are not Same!" });
    }else{
        try{
            // const newPass = await bcrypt.hash(pass1 , 10);
            await User.updateOne({ email: req.session.email },{ $set: { password: pass1 } });
            console.log("Password Update for User with email." , req.session.email);
            await sendpassUpdEmail(req.session.email, req.session.userName);
            res.render("login" , { error : "Your Password Updated!"})
        }catch (err){
            console.log("Something went wrong in Password Update for user " , req.session.userName);
            console.log(err)
            res.render("login" , { error : "Sorry! We can not update your password right now!"})
        }finally {
           delete req.session.verifyOtp;
           delete req.session.userName;
           delete req.session.email;
        }
    }
})

app.get("/update" , async (req , res) => {
     if ( req.cookies.role === "user" ){
        return res.redirect("/view");
     }else{
    const currentDate = curdate();
    res.render("updaterecord" , { error : null , username : req.cookies.name , date : currentDate , role : req.cookies.role });
     }
})

app.post("/datetoUpdate" , async (req , res) => {
    const date = req.body.date;
    const formattedDate = formatDateToPKR(date);
    try {
        const entry = await Submission.findOne({ date: formattedDate });
        const encodedDate = encodeURIComponent(formattedDate);
        const currentDate = curdate();
        if (entry) {
            res.redirect(`/update/${encodedDate}`);
        } else {
            res.render("updaterecord" , { error : "No Entry Exists for the given Date" , username : req.cookies.name , date : currentDate , role : req.cookies.role });
        }
    } catch (err) {
        res.render("updaterecord" , { error : "Something went wrong! Try Again later" , username : req.cookies.name , date : currentDate , role : req.cookies.role });
    }
})

app.get('/update/:date', async (req, res) => {
    const date = req.params.date;
    decodeddate = decodeURIComponent(date);
    encodedDate = encodeURIComponent(date);
    try {
        const entry = await Submission.findOne({ date: decodeddate });
            res.render('updatingrec', { entry: entry , postingDate : encodedDate , role : req.cookies.role });
        }
     catch (err) {
        res.render("updaterecord" , { error : "Something went wrong! Try Again later" });
        console.log(err)
    }
});

app.post('/update/:date', async (req, res) => {
    const date = req.params.date;
    decodeddate = decodeURIComponent(date);
    const { morningMilk, eveningMilk, expenses, revenues } = req.body;
    const expensesArray = Object.values(expenses || {});
    const revenuesArray = Object.values(revenues || {}); 

    expensesArray.forEach((val) => {
        val.amount = +val.amount;
    });

    revenuesArray.forEach((val) => {
        val.amount = +val.amount;
    });

    const milkRevenue = (+morningMilk + +eveningMilk) * milkPrice;

    const totalExpenses = expensesArray.reduce((sum, expense) => sum + expense.amount, 0);
    const totalRevenue = revenuesArray.reduce((sum, revenue) => sum + revenue.amount, 0) + milkRevenue;
    
    const balance = totalRevenue - totalExpenses;

    try {
        const updatedEntry = await Submission.findOneAndUpdate(
            { date: decodeddate },
            {
                morningMilkQuantity: morningMilk,
                eveningMilkQuantity: eveningMilk,
                expenses: expensesArray,
                revenues: revenuesArray,
                totalRevenue: totalRevenue,
                totalExpenditure: totalExpenses,
                Balance: balance,       
            },
        );
        if (updatedEntry) {
            res.render("insertedHome" , { msg : `Record successfully update against date ${decodeddate}`, 
            username : req.cookies.name , date : decodeddate , insertion : false})
        } 
    } catch (err) {
        res.render("insertedHome" , { msg : `Something went wrong in updatinf record against date ${decodeddate}` ,username : req.cookies.name , date : decodeddate , insertion : false})
        console.log(err);
    }
});

app.get("/logout" , (req , res) => {
    res.clearCookie("tId");
    req.session.destroy(err => {
        if (err) {
            console.log("Session destruction error:", err);
        }
        res.render("login", { error: null });
    });
})

app.get("/individualRec/:date" ,async (req , res) => {
    const date = req.params.date;
    encodedDate = encodeURIComponent(date);
    decodedDate = decodeURIComponent(date);
    try {
        const entry = await Submission.findOne({ date: decodeddate });
        res.render("individualRec" , { username : req.cookies.name , date : decodedDate , entry : entry})
    }
     catch (err) {
        // res.render("updaterecord" , { error : "Something went wrong! Try Again later" });
        console.log(err);
    }
})

app.get("/getmonths", async (req, res) => {

    try {
        const months = await MonthlyReport.find();
        const formattedMonths = months.map(month => {
            return formatMonth(month.month); 
        });
        res.render("allmonths", { 
            username: req.cookies.name, 
            role: req.cookies.role,
            date : curdate(),
            months: formattedMonths, 
        });
    } catch (err) {
        console.error('Error fetching months:', err);
        res.status(500).send('Error fetching months');
    }
});


app.get("/getrep/:month", async (req, res) => {
    const monthYear = req.params.month; 

    const formattedMonth = convertToMonthYear(monthYear);

    const [month, year] = formattedMonth.split('-');

    const startDate = new Date(year, month - 1, 1); 
    const endDate = new Date(year, month, 0);

    const formattedStartDate = formatDateToYMD(startDate);
    const formattedEndDate = formatDateToYMD(endDate);

    try {

        const records = await Submission.find({});
        const filteredRecords = records.filter(record => {
            const [day, dbMonth, dbYear] = record.date.split('/');
            function formatDateToYMD(year, month, day) {
                // Ensure month and day are always 2 digits (e.g., "08" instead of "8")
                const formattedMonth = (month).toString().padStart(2, '0');
                const formattedDay = (day).toString().padStart(2, '0');
                
                // Return the formatted date in "yyyy-mm-dd" format
                return `${year}-${formattedMonth}-${formattedDay}`;
            }

            const recordDate = formatDateToYMD(dbYear, dbMonth, day);
            return recordDate >= formattedStartDate && recordDate <= formattedEndDate;
        });
        const monthlyRecord = await MonthlyReport.findOne({
            month: formattedMonth,
        });

        
        res.render('monthReport', {
            username: req.cookies.name,
            role : req.cookies.role,
            date: new Date().toLocaleDateString(),
            month: month, 
            year: year, 
            records: filteredRecords,
            monthlyRep : monthlyRecord,
        });
    } catch (err) {
        console.error('Error fetching records for the month:', err);
        res.status(500).send('Error fetching records for the selected month');
    }
});


app.listen( PORT , () => {
    console.log("Sever Started on Port " ,PORT)
})