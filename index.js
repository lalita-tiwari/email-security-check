
var express = require('express');
const bodyParser = require("express");
const fs = require("fs");
const shell = require("shelljs");
var router = express.Router();
const simpleParser = require('mailparser').simpleParser;
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Email Security Check' });
});
router.post('/email_url/', async (req, res) => {
  let dkim_pass = false
  let spf_pass = false
  let msg = "There is some issue with the Header"
  let body = req.body.area
  let parsed = await simpleParser(body);
  if (parsed.headers.has("authentication-results")) {
    let header_auth_results = parsed.headers.get("authentication-results")
    if (header_auth_results.indexOf("dkim=pass") != -1) {

      const fs = require('fs');
      let file_name = Math.random()+'email.eml'
      const message = fs.writeFileSync(file_name, body);
      let x = shell.exec('dkimverify < '+file_name)
      console.log("x --- > " + x)
      if(x.trim()=='signature ok'){
        dkim_pass = true
      }
      fs.unlinkSync(file_name);

    } if (header_auth_results.indexOf("spf=pass") != -1) {
      let r = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
      let ip = parsed.headers.get('x-originating-ip').match(r)[0];
      r = /<(.*)>/g;
      let sender = parsed.headers.get('from')['value'][0]["address"];
      let ehlo_lst = parsed.headers.get('received')
      let ehlo = ""
      ehlo_lst.forEach(function(val_ehlo){
        if(val_ehlo.indexOf("EHLO")!=-1){
          ehlo = val_ehlo.split("EHLO ")[1].split(")")[0]
        }
      });


      console.log(ip)
      console.log(sender)
      console.log(ehlo)
      let x = shell.exec('python spfpycheck.py '+ip+" "+sender+" "+ehlo)
      console.log("y --- > " + x)
      if(x.trim()=='(\'pass\', 250, \'sender SPF authorized\')'){
        spf_pass = true
      }
      console.log(spf_pass)
      console.log(dkim_pass)

    }
  } else {
    res.render('index', {messageFailed: "Please enter the raw message body correctly!"});
  }
  if(dkim_pass && spf_pass){
    msg = "DKIM & SPF Header check passed!"
    res.render('index', {messagePassed: msg});
  }
  else if(dkim_pass && !spf_pass){
    let msgPass = "DKIM Header check passed!"
    let msgFailed = "SPF Header check failed!"
    res.render('index', {messagePassed: msgPass, messageFailed: msgFailed});
  }  else if(!dkim_pass && spf_pass){
    let msgPass = "SPF Header check passed!"
    let msgFailed = "DKIM Header check failed!"
    res.render('index', {messagePassed: msgPass, messageFailed: msgFailed});
  }else {
    msg = "DKIM & SPF Header check failed!"
    res.render('index', {messageFailed: msg});
  }
})
module.exports = router;
