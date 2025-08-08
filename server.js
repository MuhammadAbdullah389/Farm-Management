require("dotenv").config();

const User = require("./controllers/userSchema");
const PORT = 3000;
const milkPrice = 140;
const express = require("express");
const curdate = require("./controllers/currentdate");
const path = require("path")
const session = require('express-session');
const cookieParser = require("cookie-parser");
const Submission = require("./controllers/schema");

const { verifyUser } = require("./controllers/verifyUser");
const { saveUserToDb } = require("./controllers/saveUser");
const { setUser , getUser } = require("./service/auth");
const { restriction } = require("./middlewares/restriction");
const { sendOtpEmail, sendpassOTPEmail, sendpassUpdEmail} = require("./service/nodemailer");

const conn = require("./controllers/connecttoDB");
function formatDateToPKR(date) {
    return new Date(date).toLocaleDateString('en-GB', {
         timeZone: 'Asia/Karachi',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',  
    });
}

conn("mongodb://127.0.0.1:27017/farm");


const app = express();

app.set("view engine" , "ejs");
app.set("views" , "./views")


app.use(session({
    secret: 'your-secret-ke',
    resave: false,
    saveUninitialized: true,
}));
app.use(cookieParser());
app.use("/home" , restriction);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({extended : true}))
app.use(express.json());

app.get("/" , async (req , res) => {
    const userUid = req.cookies?.tId;
        if(userUid){
            const jwtToken = await getUser(userUid);
                    const { name } = jwtToken;
        }
    const entry = await Submission.findOne({ date: curdate() });
    encodedDate = encodeURIComponent(curdate());
    try {
        const entry = await Submission.findOne({ editdate: curdate() });
            // res.render('updatingrec', { entry: entry , postingDate : encodedDate});
    }
     catch (err) {
        // res.render("updaterecord" , { error : "Something went wrong! Try Again later" });
        console.log(err)
    }
    if (entry){
        res.render("insertedHome" , { msg : `Record against date ${curdate()} already exists`, 
            username : name , date : curdate() , link : encodedDate , insertion : true})
    }else{
        res.redirect("/home");
    }
});

app.get('/view', async (req, res) => {
    const entries = await Submission.find();
    const currentDate = curdate();
    const userUid = req.cookies?.tId;
                const jwtToken = await getUser(userUid);
                    const { name } = jwtToken;
    res.render('reterive', { entries: entries , date : currentDate , username : name});
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
    console.log(milkRevenue)
    console.log(totalRevenue)
    const balance = totalRevenue - totalExpenses;

    const currentDate = curdate();

    const newSubmission = new Submission({
        date: currentDate,
        morningMilkQuantity: morningMilk,
        eveningMilkQuantity: eveningMilk,
        expenses: expensesArray,
        revenues: revenuesArray,
        totalRevenue: totalRevenue,
        totalExpenditure: totalExpenses,
        Balance: balance,
    });
    const userUid = req.cookies?.tId;
                const jwtToken = await getUser(userUid);
                    const { name } = jwtToken;
    try {
        await newSubmission.save();
        res.render("insertedHome" , { msg : `Record successfully inserted against date ${currentDate}`, 
            username : name , date : currentDate})
    } catch (error) {
        console.error('Error submitting form:', error);
        res.status(500).send('Error submitting form');
    }

});

app.get("/contact" , (req , res) => {
    res.render("contactdev")
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

app.post("/login" , async (req,res) => {
    const { email , password } = req.body;
    const user = await verifyUser(email , password);
    if (user){
        const token = setUser(user);
        const oneMonth = 30 * 24 * 60 * 60 * 1000;
        res.cookie("tId", token, { expires: new Date(Date.now() + oneMonth), httpOnly: true });
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

app.get("/update" , (req , res) => {
    res.render("updaterecord" , { error : null });
})

app.post("/datetoUpdate" , async (req , res) => {
    const date = req.body.date;
    const formattedDate = formatDateToPKR(date);
    console.log(date)
    console.log(formattedDate)
    try {
        const entry = await Submission.findOne({ date: formattedDate });
        const encodedDate = encodeURIComponent(formattedDate);
        console.log(encodedDate)
        if (entry) {
            res.redirect(`/update/${encodedDate}`);
        } else {
            res.render("updaterecord" , { error : "No Entry Exists for the given Date" });
        }
    } catch (err) {
        res.render("updaterecord" , { error : "Something went wrong! Try Again later" });
        console.log(err);
    }
})

app.get('/update/:date', async (req, res) => {
    const date = req.params.date;
    decodeddate = decodeURIComponent(date);
    encodedDate = encodeURIComponent(date);
    try {
        console.log(decodeddate)
        const entry = await Submission.findOne({ date: decodeddate });
        console.log(entry)
            res.render('updatingrec', { entry: entry , postingDate : encodedDate });
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
    console.log(milkRevenue)
    console.log(totalRevenue)
    const balance = totalRevenue - totalExpenses;

    const userUid = req.cookies?.tId;
                const jwtToken = await getUser(userUid);
                    const { name } = jwtToken;

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
            username : name , date : decodeddate , insertion : false})
        } 
    } catch (err) {
        res.render("insertedHome" , { msg : `Something went wrong in updatinf record against date ${decodeddate}` ,username : name , date : decodeddate , insertion : false})
        console.log(err);
    }
});

app.get("/logout" , (req , res) => {
    res.clearCookie("tId");
    res.render("login" , { error : null })
})

app.get("/individualRec/:date" ,async (req , res) => {
    const date = req.params.date;
    decodeddate = decodeURIComponent(date);
    encodedDate = encodeURIComponent(date);
    const userUid = req.cookies?.tId;
                const jwtToken = await getUser(userUid);
                    const { name } = jwtToken;
    decodedDate = decodeURIComponent(date);
    try {
        console.log(decodeddate)
        const entry = await Submission.findOne({ date: decodeddate });
        console.log(entry)
        res.render("individualRec" , { username : name , date : decodedDate , entry : entry})
    }
     catch (err) {
        // res.render("updaterecord" , { error : "Something went wrong! Try Again later" });
        console.log(err);
    }
})

app.listen( PORT , () => {
    console.log("Sever Started")
})