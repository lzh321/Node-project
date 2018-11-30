var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var async = require('async');

var url = 'mongodb://127.0.0.1:27017';

/* GET home page. */
router.get('/index.html', function(req, res, next) {

  res.render('index',{nickname:req.cookies.nickname,isadmin:req.cookies.isadmin});
  // res.render('head')
});




//登录页面
router.get('/login.html',function(req,res,next){
  res.render('login',{nickname:req.cookies.nickname,isadmin:req.cookies.isadmin});
})



//注册页面
router.get('/register.html',function(req,res){
  res.render('register',{nickname:req.cookies.nickname,isadmin:req.cookies.isadmin});
})









//删除学生信息
router.get('/deletestudent',function(req,res){
  var id = req.query.id;  //获取id
  MongoClient.connect(url,{useNewUrlParser:true},function(err,client){
    if(err){
      //连接数据库失败
      res.render('error',{
        message:'连接数据库失败',
        error:err
      });
    }

    var db = client.db('studentSystem');
    db.collection('studentInfo').deleteOne({_id : ObjectId(id)},function(err,data){
      if(err){
        //删除失败
        res.render('error',{
          message:'删除失败',
          error:err
        });
      }else{
        //删除成功
        res.redirect('/users/studentInfo.html');
      }
      //关闭数据库
      client.close();
    })
  })
})








module.exports = router;
