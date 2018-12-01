var express = require('express');
var router = express.Router();
var MongoClient= require('mongodb').MongoClient;
var async = require('async');
var ObjectId = require('mongodb').ObjectId;  //mongodb下的一个获取ID的方法
var url = 'mongodb://127.0.0.1:27017';
var fs = require('fs');
var path = require('path');

/* GET users listing. */
router.get('/user.html', function(req, res, next) {
  var page = parseInt(req.query.page) || 1;  //页码
  var pageSize = parseInt(req.query.pageSize) || 5;  //每页显示的条数
  var totalSize = 0;  //总条数
  var searchVal = new RegExp(req.query.searchVal);
  MongoClient.connect(url,{useNewUrlParser:true},function(err,client){
    if(err){
      //连接数据库失败
      console.log('连接数据库失败',err)
      res.render('error',{
        message:'连接数据库失败',
        error:err
      });
      return;
    }
    var db = client.db('studentSystem');   //连接数据库名

    async.series([
      function(cb){
        db.collection('user').find().count(function(err,num){  //查询数据库中一共有多少条数据
          if(err){  //查询失败
            cb(err)
          }else{
            totalSize = num;    //把得到的条数作为总条数
            cb(null)
          }
        })
      },
      function(cb){
        //每页显示5条数据
        //使用limit截取5条数据，为了保证每次截到的数据不同，
        
        db.collection('user').find().limit(pageSize).skip(page*pageSize-pageSize).toArray(function(err,data){
          if(err){
            cb(err); //获取数据失败
          }else{
            cb(null,data)
          }
        })
      },
      function(cb){
        db.collection('user').find({$or:[{nickname:searchVal},{sex:searchVal}]}).toArray(function(err,data1){
    
          if(err){
            cb(err)
          }else{
            cb(null,data1)
          }
        })
      }
    ],function(err,result){
      if(err){
        res.render('error',{
          message:'错误',
          error:err
        })
      }else{
        var totalPage = Math.ceil(totalSize / pageSize);  //总条数 / 每页显示的条数 = 总的页数
        res.render('user',{
          list:result[1],
          list:result[2],
          pageSize:pageSize,
          totalPage:totalPage,
          currentPage:page,
          nickname:req.cookies.nickname,
          isadmin:req.cookies.isadmin
        })
      }
      client.close()
    })



    // db.collection('user').find().toArray(function(err,data){   //连接集合
    //   if(err){
    //     //查询用户数据失败
    //     console.log('查询用户数据失败',err)
    //     res.render('error',{
    //       message:'查询用户数据失败',
    //       error:err
    //     })
    //   }else{
    //     console.log(data)
    //     res.render('user',{
    //       list:data,
    //       nickname:req.cookies.nickname
    //     });
    //   }
    //   //关闭数据库连接
    //   client.close();
    // })
  })
});

//登录验证
router.post('/login',function(req,res){
  //非空验证
  var username = req.body.username;
  var password = req.body.pwd;
  //验证参数的有效性
  if(!username){
    res.render('error',{
      message:'用户名不能为空',
      error:new Error('用户名不能为空')
    })
    return;
  }
  if(!password){
    res.render('error',{
      message:'密码不能为空',
      error: new Error('密码不能为空')
    })
    return;
  }
  MongoClient.connect(url,{useNewUrlParser:true},function(err,client){
    if(err){
      console.log('连接数据库失败');
      res.render('error',{
        message:'连接数据库失败',
        error:err
      });
    }
    var db = client.db('studentSystem'); 

    // async.series([
    //   function(cb){
    //     db.collection('user').find({username:username,password:password}).toArray(function(err,data){
    //       if(err){
    //         cb(err);
    //         }else if(data <= 0){
    //           cb(err)
    //         }else{
    //           cb(null,data)
    //         }
    //       })       
    //   },
    //   function(cb){
    //     db.collection('user').find({nickname:req.query.})
    //   }
    // ],function(err,result){
    //   if(err){
    //     res.render('error',{
    //       message:'错误',
    //       error:err
    //     })
    //   }else{
    //     res.cookie
    //   }
    // })
    db.collection('user').find({
      username:username,
      password:password
    }).toArray(function(err,data){
      if(err){
        //查询失败
        console.log('查询失败',err)
        res.render('error',{
          message:'查询失败',
          error:err
        })

      }else if(data.length <= 0){
        // 没找到用户。登录失败
        res.render('error',{
          message:'登录失败',
          error: new Error('登录失败')
        })
      }else{
        //登录成功 把信息保存到cookie里
        
        //cookie操作
        res.cookie('nickname',data[0].nickname,{
          maxAge: 30 * 60 * 1000
        });
        res.cookie('isadmin',data[0].isadmin,{
          maxAge: 30 * 60 * 1000
        })
        // var isadmin = data[0].isadmin
         res.redirect('/index.html')
         
         
      }
      //关闭数据库连接
      client.close();
    })
  })
  // res.send('');      这个地方不需要加end()结束,因为 mongodb 的操作是异步操作
});


// router.get('/common/menu.html')

//注册操作

router.post('/register',function(req,res){
  MongoClient.connect(url,{useNewUrlParser:true},function(err,client){
    var name = req.body.username;
    var pwd = req.body.pwd;
    var nickname = req.body.nickname;
    var age =parseInt(req.body.age);
    var sex = req.body.sex;
    var isadmin = req.body.isadmin == '是' ? true : false;

    if(!name){
      res.render('error',{
        message:'用户名不能为空',
        error:new Error('用户名不能为空')
      })
      return;
    }
    if(!pwd){
      res.render('error',{
        message:'密码不能为空',
        error: new Error('密码不能为空')
      })
      return;
    }
    if(!nickname){
      res.render('error',{
        message:'昵称不能为空',
        error:err
      })
      return;
    }

    if(err){
      //连接数据库失败
      console.log('连接数据库失败');
      res.render('error',{
        message:'连接数据库失败',
        error:err
      });
      return ;
    }
    var db = client.db('studentSystem');

    //异步流程控制
    async.series([
      function(cb){
        db.collection('user').find({username:name}).count(function(err,num){   //查询数据库中是否存在username:name 这条数据，num>0说明存在，否则就不存在
          if(err){  //获取用户数据失败
            cb(err)
          }else if(num > 0){  //这个人已经注册了
            cb( new Error('已经注册了'))
          }else{
            cb(null)  //可以注册
          }
        })
      },
      function(cb){  //把信息写入MongoDB数据库
        db.collection('user').insertOne({
          username:name,
          password:pwd,
          nickname:nickname,
          age:age,
          sex:sex,
          isadmin:isadmin
        },function(err){
          if(err){
            cb(err);
          }else{
            cb(null);
          }
        })
      }
    ],function(err,result){
      if(err){
        res.render('error',{
          message:'错误',
          error:err
        })
      }else{
        res.redirect('/login.html')
      }
      //不管成功或者失败都要关闭数据库连接
      client.close();
    })
  })
});

//删除操作  http://localhost:3000/users/delect

router.get('/delete',function(req,res){
  var id = req.query.id;  // 获取id

  //连接数据库
  MongoClient.connect(url,{useNewUrlParser:true},function(err,client){
    if(err){
      res.render('error',{
        message:'连接数据库失败',
        error:err
      });
    }
    var db = client.db('studentSystem');
    db.collection('user').deleteOne({ _id : ObjectId(id) },function(err,data){
      if(err){
        res.render('error',{
          message:'删除失败',
          error:err
        })
      }else{
        //删除成功
        res.redirect('/users/user.html')
      }
      //关闭数据库
      client.close();

    })
  })
});


// router.get('/',function(req,res){
//   var nickname = req.query.cookie.nickname
//     console.log(nickname)
//   MongoClient.connect(url,{useNewUrlParser:true},function(err,client){
    
//     if(err){
//       res.render('error',{
//         message:'连接数据库失败',
//         error:err
//       })
//     }
//     var db = client.db('studentSystem');
//     db.collection('user').find({nickname:nickname}).toArray(function(err,data){
//       if(err){
//         res.render('error',{
//           message:'连接失败',
//           error:err
//         })
//       }else{
//         res.render('/',{
//           isadmin:data
//         })
//       }
//     })
//   })
// })



//从后台数据库获取学生信息
router.get('/studentInfo.html',function(req,res){
  // res.render('studentInfo');
  var page = parseInt(req.query.page) || 1;  //页码
  var pageSize = parseInt(req.query.pageSize) || 5;  //每页显示的条数
  var totalSize = 0;  //总共的条数
  var data = [];

  MongoClient.connect(url,{useNewUrlParser:true},function(err,client){
    if(err){
      res.render('error',{
        message:'连接数据库失败',
        error:err
      });
      return;
    }
    var db = client.db('studentSystem');

    async.series([
      function(cb){
        db.collection('studentInfo').find().count(function(err,num){
          if(err){
            cb(err);
          }else{
            totalSize = num;
            cb(null);
          }
        })
      },
      function(cb){
        db.collection('studentInfo').find().limit(pageSize).skip(page*pageSize-pageSize).toArray(function(err,data){
          if(err){
            cb(err)
          }else{
            cb(null,data)
          }

        })
      }
    ],function(err,results){  //results  把 data接收下来 得到的是一个数组  [undefiend,data]
      if(err){
        res.render('error',{
          message:'错误',
          error:err
        })
      }else{
        var totalPage = Math.ceil(totalSize / pageSize);  //总的页数
        // console.log(totalPage)
        res.render('studentInfo',{
          list:results[1],
          totalPage:totalPage,
          pageSize:pageSize,
          currentPage:page,
          nickname:req.cookies.nickname,
          isadmin:req.cookies.isadmin
        })
      }
      client.close()
    })

    // db.collection('studentInfo').find().toArray(function(err,data){
    //   if(err){
    //     res.render('error',{
    //       message:'获取学生信息失败',
    //       error:err
    //     });
    //   }else{
    //     res.render('studentInfo',{
    //       list:data,
    //       nickname:req.cookies.nickname
    //     })
    //   }
    //   //关闭数据库连接
    //   client.close();
    // })
  })
})



//学生成绩页面
router.get('/creditScores.html',function(req,res){
  var page = parseInt(req.query.page) || 1;  //页码为1
  var pageSize = parseInt(req.query.pageSize) || 6;  //一页显示的条数
  var totalSize = 0 ;   //总条数，初始化为0

  MongoClient.connect(url,{useNewUrlParser:true},function(err,client){
    if(err){   // 判断是否连接数据库失败
      res.render('error',{
        message:'连接数据库失败',
        error:err
      })
      return;
    }
    var db = client.db('studentSystem');  //连接数据库成功
    //这里因为需要多次操作数据库，所以使用异步操作流程 
    //  第一步 把数据取出来，显示在页面
    //  第二步 截取数据，把数据按一页3条的形式渲染在页面
    async.series([
      function(cb){
        db.collection('studentMark').find().count(function(err,num){
          if(err){
            cb(err)
          }else{
            totalSize = num;
            cb(null)
          }
        })
      },
      function(cb){
        db.collection('studentMark').find().limit(pageSize).skip(page*pageSize-pageSize).toArray(function(err,data){
          if(err){
            cb(err)
          }else{
            cb(null,data)
          }
        })
      }
    ],function(err,result){
      var totalPage = Math.ceil(totalSize / pageSize);
      res.render('creditScores',{
        list:result[1],
        totalPage:totalPage,
        pageSize:pageSize,
        currentPage:page,
        nickname:req.cookies.nickname,
        isadmin:req.cookies.isadmin
      })
    })

  })
  // res.render('creditScores',{nickname:req.cookies.nickname})
})

//学生信息页
router.get('/setStudentInfo.html',function(req,res){
  res.render('setStudentInfo',{nickname:req.cookies.nickname,isadmin:req.cookies.isadmin})
})

//新增
router.post('/setInfo',function(req,res){
  MongoClient.connect(url,{useNewUrlParser:true},function(err,client){
    var name = req.body.username;
    var age = parseInt(req.body.age);
    var sex = req.body.sex;
    var department = req.body.department;
    var grade = req.body.grade;
    var timeOfEnrollment = req.body.timeOfEnrollment;
    if(!name){
      res.render('error',{
        message:'姓名不能为空',
        error:new Error('姓名不能为空')
      })
      return;
    }
    if(!age){
      res.render('error',{
        message:'年龄不能为空',
        error:new Error('年龄不能为空')
      })
      return;
    }
    if(!department){
      res.render('error',{
        message:'院系不能为空',
        error:new Error('院系不能为空')
      })
      return;
    }
    if(!grade){
      res.render('error',{
        message:'班级不能为空',
        error:new Error('班级不能为空')
      })
      return;
    }
    if(!timeOfEnrollment){
      res.render('error',{
        message:'入学时间不能为空',
        error:new Error('入学时间不能为空')
      })
      return;
    }
    if(err){
      res.render('error',{
        message:'连接数据库失败',
        error:err
      })
      return;
    }
    var db = client.db('studentSystem');
    async.series([
      function(cb){
        db.collection('studentInfo').find({name:name}).count(function(err,num){  
          console.log(name)
          if(err){  //获取用户数据失败
            cb(err)
          }else if(num > 0){  //  判断是否存在这条数据
            cb(new Error('这个人已经存在'))
          }else{
            cb(null)  //不存在这条数据，可以添加
          }
        })
      },
      function(cb){
        db.collection('studentInfo').insertOne({
          name:name,
          age:age,
          sex:sex,
          department:department,
          grade:grade,
          timeOfEnrollment:timeOfEnrollment
        },function(err){
          if(err){
            cb(err)  //添加用户失败
          }else{
            cb(null)   //添加成功
          }
        })
      }
    ],function(err,results){
      if(err){
        res.render('error',{
          message:'错误',
          error:err
        })
      }else{
        res.redirect('/users/studentInfo.html')
      }
      client.close();
    })
  })
})


//退出 清除cokkie 跳转到登录页面
router.get('/deletecookie',function(req,res,next){
  
  res.clearCookie('nickname')
  res.redirect('/login.html')
  })



//上传图片

//自己实现的中间件，用来做上传图片的
//引用multer 模板
var multer = require('multer') 
//dets设置
var upload = multer({dest:'E:/1809/Node-project/tmp'})

router.post('/upload',upload.single('file'),function(req,res,next){
  //single 是单个文件上传  array以数组多个上传
  //使用了 multer ，并且在当前接口上使用了，这些req对象上就会有一个file属性就包含这你上传过来的一些信息
  
  var filename = 'phoneImg/' + new Date().getTime() + '_' + req.file.originalname
  var newFileName= path.resolve(__dirname,'../public/phoneImg/',new Date().getTime() + '_' + req.file.originalname);
  try{
    var data = fs.readFileSync(req.file.path);
    fs.writeFileSync(newFileName,data)
    // res.send('上传成功')
    MongoClient.connect(url,{useNewUrlParser:true},function(err,client){
      if(err){
        res.render('error',{
          message:'连接数据库失败',
          error:err
        })
      }
      var db = client.db('studentSystem');
      async.series([
        function(cb){
          db.collection('headportrait').insertOne({name:req.body.phoneImg,headportraitUrl:filename},function(err){
            if(err){
              cb(err)
            }else{
              cb(null)
            }
          })
        },
        function(cb){
          db.collection('headportrait').find().toArray(function(err,data){
            if(err){
              cb(err)
            }else{
              cb(null,data)
            }
          })
        }
      ],function(err,result){
        if(err){
          res.render('error',{
            message:'错误',
            error:err
          })
        }else{
          res.render('index',{
            list:result[1]
          })
        }
      })
     })
  } catch(error) {
    res.render('error',{
      message:'新增图片失败',
      error:error
    })
  }
  // res.redirect('/index.html')
  console.log(req.file)
})




module.exports = router;
