const express = require('express');
let session = require('express-session')
const fs = require('fs')
const request = require('request')
const {randomBytes} =require('crypto')
const app = express();
const sessionTime = 1000 * 60 * 60 * 24
const PORT = 8888;
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(session({
    secret: 'abcdefghijklmnopqrstuvwxyz',
    saveUninitialized: true,
    cookie: { maxAge: sessionTime },
    resave: false
}))
const a = [];
const API_KEY = '04c65cb3f0f93f41cdc5a3ee51a7ddf7'
const weatherurl = `http://api.openweathermap.org/data/2.5/forecast?q=PUNE&appid=${API_KEY}`
app.set('view engine', 'ejs');
app.get('/', (req, res) => {
    if(req.session.csrf===undefined){
             req.session.csrf=randomBytes(100).toString('base64')

    }
    let list = fs.readFileSync('emplist.txt').toString().split(`*`);
    let emplist = [];
    list.map(val =>
        emplist.push(JSON.parse(val))
    )
    console.log(emplist);
    res.render('home', { emplist: emplist });
})
app.get('/form', (req, res) => {
    res.render('form',{csrf_token:req.session.csrf});

})
app.post('/form', (req, res) => {
    console.log(req.session.csrf);
    console.log(req.body.csrf);
    if(!req.body.csrf){
        res.send('not included')
    }
    else if(req.body.csrf!==req.session.csrf){
        res.send('not match')
    }
    else{
    fs.appendFile('emplist.txt', `*{"name":"${req.body.name}","email":"${req.body.email}","phone":"${req.body.phone}","age":"${req.body.age}"}`, (err) => { if (err) throw err; })
    res.redirect("/")
    }

})
app.get("/delete/:id([0-9]+)", (req, res) => {
    let id = req.params.id;
    let list = fs.readFileSync('emplist.txt').toString().split(`*`);
    let emplist = [];
    list.map(val =>
        emplist.push(JSON.parse(val))
    )
    emplist.splice(id, 1)
    let newdata = '';
    emplist.map(val => {
        newdata += JSON.stringify(val) + '*';
    })
    newdata = newdata.substr(0, newdata.length - 1)
    fs.writeFile('emplist.txt', `${newdata}`, (err) => { if (err) throw err; console.log("file written") });
    res.redirect("/")

})
app.get("/update/:id([0-9]+)", (req, res) => {
    console.log({ name: req.query.name, email: req.query.email, phone: req.query.phone, age: req.query.age })
    res.render('updateform', { name: req.query.name, email: req.query.email, phone: req.query.phone, age: req.query.age })
})
app.post("/update/:id([0-9]+)", (req, res) => {
    let id = req.params.id;
    let newdataa = { name: req.body.name, email: req.body.email, phone: req.body.phone, age: req.body.age }
    let list = fs.readFileSync('emplist.txt').toString().split(`*`);
    let emplist = [];
    list.map(val =>
        emplist.push(JSON.parse(val))
    )
    emplist.splice(id, 1, newdataa)
    let newdata = '';
    emplist.map(val => {
        newdata += JSON.stringify(val) + '*';
    })
    newdata = newdata.substr(0, newdata.length - 1)
    fs.writeFile('emplist.txt', `${newdata}`, (err) => { if (err) throw err; console.log("file written") });
    res.redirect("/")
})


app.get("/weather", (req, res) => {
   

    let dataPromise = getWeather()
    dataPromise.then(JSON.parse)
        .then(function (result) {
            res.render('weather', { result, title: 'Weather API' })
        })
})

function getWeather() {
    let options = {
        url: weatherurl,
        headers: {
            'User-Agent': 'request'
        }
    }

    return new Promise(function (resolve, reject) {
        request.get(options, function (err, response, body) {
            if (err) {
                reject(err);
            }
            else {
                resolve(body)
            }
        })
    })
}

app.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`working on port :${PORT}`)
})