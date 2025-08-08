const currdate = () => {
 return new Date().toLocaleDateString('en-GB', {
        timeZone: 'Asia/Karachi',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
};

module.exports = currdate;