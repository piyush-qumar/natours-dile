const AppError=require('./../utils/appError');

const handleCastErrorDB=err=>{
    const message=`Invalid ${err.path}:${err.value}.`;
    return new AppError(message,400);
};
const handleDuplicateFieldsDB=err=>{
    const value=err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    console.log(value);
    const message=`duplicate fields value:${value}.please use another value`;
    return new AppError(message,400);
};
const handleValidationErrorDB=err=>{
    const errors=Object.values(err.errors).map(el=>el.message);
    const message=`invalid inpuy data.${errors.join('. ')}`;
    return new AppError(message,400);
};
const handleJWTError=err=>new AppError('invalid token. please login again!',401)
const handleJWTExpiredError=err=>new AppError('your token has expired !please login again.',401)

const sendErrorDev=(err,res)=>{
    if(req.originalUrl.startsWith('/api')){
        res.status(err.statusCode).json({
            status:err.status,
            error:err,
            message:err.message,
            stack:err.stack
        });  
    }
        console.error('ERROR',err);
        res.status(err.statusCode).render('error',{
            title:'Something went wrong!',
            msg: err.message
        });
    
    
};
const sendErrorProd=(err,req,res)=>{
    if(req.originalUrl.startsWith('/api')){
    
    if(err.isOperational){
       return res.status(err.statusCode).json({
            status:err.status,
            message:err.message
    });
}
    console.error('ERROR',err);
    return res.status(500).json({
        status:'error',
        message:'somethings wrong!'
    });

    }
        if(err.isOperational){
           return res.status(err.statusCode).render('error',{
                title:'Something went wrong!',
                msg: err.message
            });
    }
        console.error('ERROR',err);
       return res.status(err.statusCode).render('error',{
            title:'Something went wrong!',
            msg: 'please try gain later'
        });
    
    
};
module.exports=(err,req,res,next)=>{

    err.statusCode=err.statusCode||500;
    err.status=err.status||'error';
    if(process.env.NODE_ENV==='development'){
        sendErrorDev(err,req,res);

    }else if(process.env.NODE_ENV==='production'){
        let error={...err};
        error.message=err.message;
        if(error.name==='CastError') error=handleCastErrorDB(error);
        if(error.code===11000)error=handleDuplicateFieldsDB(error);
        if(error.name==='ValidationError')
        error=handleValidationError(error);
        if(error.name==='JsonWebTokenError') error=handleJWTError(error)
        if(error.name==='TokenExpiredError')error=handleJWTExpiredError(error);
        sendErrorProd(err,req,res);
    }
};