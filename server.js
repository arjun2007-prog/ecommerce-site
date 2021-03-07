const express = require("express");
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const session = require("express-session")
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose")

const app = express();

app.set("view engine" , "ejs");
app.use(express.static("public"))
app.use(bodyParser.urlencoded({ extended:true}))
app.use(session({
    secret:"password",
    resave:false,
    saveUninitialized:true,
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/ecommerceDB",{useNewUrlParser:true , useUnifiedTopology:true , useCreateIndex :true})

const userSchema = new mongoose.Schema({
    email:String,
    password:String,
    name:String,
    type:String,
})

const sellerSchema = new mongoose.Schema({
    products:[],
    income:Number,
    //Here we can store all diffrent kind of data and anaylatics later                                                 s
})

const customerSchema = new mongoose.Schema({
    userId:String,
    cart:[]
    //We will add futher data and anaylatics for this user
})

const productSchema = new mongoose.Schema({
    name:String,
    price:String,
    description:String,
    image:String,
    seller:String,
    comment:[Object],
    Buyer:[]
})

userSchema.plugin(passportLocalMongoose)

const Users = mongoose.model("user",userSchema)
const Seller = mongoose.model("seller",sellerSchema)
const Customer= mongoose.model("customer",customerSchema)
const Products = mongoose.model("product",productSchema)

passport.use(Users.createStrategy());


passport.serializeUser(Users.serializeUser());
passport.deserializeUser(Users.deserializeUser());

app.route("/")
    .get((req,res)=>{
        if (req.isAuthenticated()==true) {
            if(req.user.type == "user"){
                res.render("shop")
            }
            else if(req.user.type == "seller"){
                res.redirect("/seller/dashboard")
            }
        }
        else{
            res.redirect("/login")
        }
 
    })



//Register route
app.route("/register")
   .get((req,res)=>{
         res.render("register",{sendTo:"/register",type:"user"});
   })
   .post((req,res)=>{
       //Here we will authenticate and create a new user
       console.log(req.body);
       userToRegister =new Users({name: req.body.name, username : req.body.username , type: req.body.type});

       Users.register(userToRegister,req.body.password,(err,user)=>{
            if(err){
                console.log(err);
                res.redirect("/register");
            }
            else{
                res.redirect("/login");
 
            }
       })
   })


//Login route
//this is the login route for the buyers
app.route("/login")
   .get((req,res)=>{
       if(req.isAuthenticated()==true){
           res.redirect("/")
       }
       else{
        res.render("login",{sendTo:"/login"})
       }
       
   })
   .post((req,res)=>{
       //Here we will see if the user is in our db
       const loginUser = new Users({
        username: req.body.username,
        password: req.body.password
       })
           
       console.log(loginUser);
       req.login(loginUser,function(err){
        if (err) {
            console.log(err);
            res.redirect("/login");
        }
        //We are just creating a cookie for his browsing session , to rember that he is logged in
        else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/");
              });
        }
    })
   })

//sellers
//this is seller dashbord path where the seller can add products that the users can buy

app.route("/seller/dashboard")
   .get((req,res)=>{
       if(req.isAuthenticated()==true){
        console.log(req.user);
        res.render("dashboard")
       }
       else{
           res.redirect("/sellers/login")
       }
       
    })
    .post((req,res)=>{
        console.log(req.body);
        console.log(req.user);

        const sellerProduct = new Products({
            name:req.body.productName,
            price:req.body.price,
            description: req.body.description,
            image:req.body.imageurl,
            seller:req.user._id,
        })
        sellerProduct.save();
    })   

//This is the login route for the sellers   
app.route("/sellers/register")
   .get((req,res)=>{
       res.render("register",{sendTo:"/sellers/register",type:"seller"})
   })
   .post((req,res)=>{
       //Here we will see if the user is in our db
       userToRegister =new Users({name: req.body.name, username : req.body.username});
       Users.register(userToRegister,req.body.password,(err,user)=>{
            if(err){
                console.log(err);
                res.redirect("/sellers/register");
            }
            else{
                res.redirect("/sellers/login"); 
            }
        })
   }) 

//This is seller login path

app.route("/sellers/login")
   .get((req,res)=>{
       res.render("login",{sendTo:"/sellers/login",type:"seller"})
   })
   .post((req,res)=>{
    const loginUser = new Users({
        username: req.body.username,
        password: req.body.password,
       })
           
       console.log(loginUser);
       req.login(loginUser,function(err){
        if (err) {
            console.log(err);
            res.redirect("/seller/login");
        }
        //We are just creating a cookie for his browsing session , to rember that he is logged in
        else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/seller/dashboard");
              });
        }
    })
   })



app.listen(3000,()=>{
    console.log("Sucsessfully hosted on port 3000");
})


