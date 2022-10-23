#  DKIM SPF Verification Tool

### Description of Tool:
This is a tool to validate a raw email meassage for DKIM & SPF verification.
This is written on NodeJs Express framework which internally utilizes Python to run dkimpy & pyspf commands.
The tool is tested on macos using Webstorm, also tested using standalone npm start.

### The Problem and initial approach:
Initially I was trying to validate DKIM by reading 4 header values:
- b = Signature
- bh = Email hash
and by obtaining the public_key from 
- dig [s header]._domainkey.[d header]. txt +nostats +noquestion  

I tried a lot to use this public key to validate the signature, but it never worked:
openssl dgst -sha256 -verify public_key -signature b bh
This is the same case with SPF, I was able to pull the hashes:
dig +short -t txt [d header]
but again was not able to verify it against the public key.

### Final Solution:
So, ultimately I changed my approach to use python packages, Below is the description how this app works:

1. On initialization app.js installs the python packages if not already present:
   const shell = require('shelljs')
   let pack = shell.exec('pip list|grep dkimpy')
   if(pack.indexOf("dkimpy")!=-1){
   console.log("dkimpy available")
   }else{
   shell.exec('yes | pip install dkimpy')
   }
   pack = shell.exec('pip list|grep pyspf')
   if(pack.indexOf("pyspf")!=-1){
   console.log("pyspf available")
   }else{
   shell.exec('yes | pip install pyspf')
   }
  
2. index.js is the backend api for index.pug ui.
3. When user hits the default url [http://localhost:3000/], User is presented with a screen to fill in raw email message.
4. The submit button calls the backend index.js which does the following:
    
    4.1. Code checks for spf=pass and dkim=pass headers added by email service provider. If not present then it directly fails the validation.
    
    4.2. If primary check passed then it verifies the DKIM signature:
       const fs = require('fs');
       let file_name = Math.random()+'email.eml'
       const message = fs.writeFileSync(file_name, body);
       let x = shell.exec('dkimverify < '+file_name)
       console.log("x --- > " + x)
       if(x.trim()=='signature ok'){
       dkim_pass = true
       }
       fs.unlinkSync(file_name);
    ==>> in case of failure it fails the validation
    
    4.3. If primary check passed then it verifies the SPF check:
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
   ==>> in case of failure it fails the validation
   
    4.4. Based on the validation results, The UI updates the user one of the below results:
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
### How to run this tool from the code

``` 
git clone https://github.com/lalita-tiwari/email-security-check.git
cd email-security-check

email-security-check % npm start 
```
 
The above command will install the packages dkimpy and pyspf and you will see a below message like this.
``` 
Successfully built dkimpy
Successfully built pyspf
Installing collected packages: pyspf
Successfully installed pyspf-2.0.14
```
