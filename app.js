var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.use(express.json({limit: '500mb'}));
app.use(express.urlencoded({limit: '500mb'}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
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
module.exports = app;
