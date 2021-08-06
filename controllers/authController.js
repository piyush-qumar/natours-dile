const crypto=require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken')
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');


const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

const createSendToken=(user,statusCode,res)=>{
    const token=signToken(user._id);
    const cookieOptions={
        
            expires: new Date(Date.now()+process.env.JWT_COOKIE_EXPIRES_IN
            *24*60*60*1000),
            secure:true,
            httpOnly:true
        };
    if(process.env.NODE_ENV==='production')cookieOptions.secure=true;
    //const token = signToken(user._id);

    res.cookie('jwt',token,cookieOptions);
    user.password=undefined;
       /*  expires: new Date(Date.now()+process.env.JWT_COOKIE_EXPIRES_IN
        *24*60*60*1000),
        secure:true,
        httpOnly:true
    } */

    res.status(statusCode).json({
        status: 'success',
        token,
        data:{
            user
        }
    });
}

exports.signup = catchAsync(async (req, res, next) => {
    //  const newUser=await User.create(req.body);
    const newUser = await User.create(req.body);
    const url=`${req.protocol}://${req.get('host')}/me`;
    console.log(url);
    await new Email(newUser,url).sendWelcome();
        createSendToken(newUser,201,res);

     /*    name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm
    });
    const token = signToken(newUser._id);
    res.status(201).json({
        status: 'success',
        token,
        data: {
            user: newUser
        }
    }); */
});
exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    //check existence
    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400));
    }
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }
    //console.log(user);
    createSendToken(user,200,res);
    /* const token = signToken(user._id);

    res.status(200).json({
        status: 'success',
        token
    }); */
});

exports.logout=(req,res)=>{
    res.cookie('jwt','loggedout',{
        expires:new Date(Date.now()+10*1000),
        httpOnly:true
    });
    res.status(200).json({status:'success'});
};
exports.protect = catchAsync(async (req, res, next) => {
    //check token if its there
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }else if(req.cookies.jwt){
        token=req.cookies.jwt;
    }
    //console.log(token);
    if (!token) {
        return next(new AppError('you are not logged in! please login to get access.', 401))
    }
    //verification
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    //----------console.log(decoded);
    //check if user exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(new AppError('the token belonging to this user does no longer exist', 401));
    }
    //check if user changed password after token issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed the password! please login again ', 401));
    }
    req.user = currentUser;
    res.locals.user=currentUser;
    next();
});

exports.isLoggedIn = async (req, res, next) => {
     if(req.cookies.jwt){
         try{
    //verification
    const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
    //----------console.log(decoded);
    //check if user exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next();
    }
    //check if user changed password after token issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
    }
    res.locals.user =currentUser;
  //  req.user = currentUser;
   return next();
}catch(err){
    return next();
 }
     }
next();
     
};




exports.restrictTo= (...roles)=>{
    return(req,res,next)=>{
        //roles [admin,lead-guide].role ='user'
        if(!roles.includes(req.user.role)){
        return next(new AppError('you do not have permission to perform this action ',403));

    }
    next();
};
};
exports.forgotPassword=catchAsync(async(req,res,next)=>{    
const user=await User.findOne({email:req.body.email});
if(!user){
    return next(new AppError('there is no uder with email addresss',404));
}
const resetToken=user.createPasswordResetToken();
await user.save({validateBeforeSave:false});



/* const message=`Forgot your Password?
Submit a patch request with your new password and 
passwordConfirm to:${resetURL}
.\nIf you didn't forget your pasword ,please ignore this email!`; */
try{
    const resetURL=`${req.protocol}://${req.get('host'
)}/api/v1/users/resetPassword/${resetToken}`;

await new Email(user,resetURL).sendPasswordReset();
res.status(200).json({
    status:'success',
    message:'Token sent to email'
});
}catch(err){
    user.passwordResetToken=undefined;
    user.passwordResetExpires=undefined;
    await user.save({validateBeforeSave:false});

    return next(new AppError('there was an error sending the email.try again later'),
    500);
}
});

exports.resetPassword=catchAsync(async(req,res,next)=>{
    //get user based onn token
    const hashedToken=crypto.createHash('sha256')
    .update(req.params.token)
    .digest('hex');
    const user=await User.findOne({passwordResetToken:hashedToken
    ,passwordResetExpires:{$gt:Date.now()}});

    //set to new password
    if(!user){
        return next(new AppError('Token is invalid or has expired',400))
    }
    user.password=req.body.password;
    user.passwordConfirm=req.body.passwordConfirm;
    user.passwordResetToken=undefined;
    user.passwordResetExpires=undefined;
    await user.save();
    // update the changed password
    //log the user in
    createSendToken(user,200,res);
   /*  const token = signToken(user._id);

    res.status(200).json({
        status: 'success',
        token
    }); */
});
exports.updatePassword=catchAsync(async(req,res,next)=>{
    // get user from the collection
    const user=await User.findById(req.user.id).select('+password');
    // check if posted password is corect
    if(!(await user.correctPassword(req.body.passwordCurrent, user.password))){
        return next(new AppError('Yor current password is wrong',401));
    }
    // update password
    user.password=req.body.password;
    user.passwordConfirm=req.body.passwordConfirm;
    await user.save();

    // log user in
    createSendToken(user,200,res);

}); 