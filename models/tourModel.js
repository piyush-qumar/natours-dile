const mongoose=require('mongoose');
const slugify=require('slugify');
//const User=require('./userModel');
//const validator=require('validator');
const tourSchema=new mongoose.Schema({
    name:{

    type: String,
    required:[true,'A TOUR MUST HAVE NAME'],
    unique:true,
    trim :true,
    maxlength:[40,'must be less than 40'],
    minlength:[10,'must be more than 10'],
},
slug:String,
duration:{
    type:Number,
    requires:[true,'a tour must have duration']
},
maxGroupSize:{
    type:Number,
    required:[true,'a tour must have a group size']
},
difficulty:{
    type:String,
    required:[true,'a tour must have difficulty'],
    enum:{
        values:['easy','medium','difficult'],
        message:'difficulty is either esy or med or diff'
    }
},
ratingsAverage:{
    type:Number,
    default:4.5,
    min:[1,'rating must be above 1.0'],
    max:[5,'rating must be below 5.0'],
    set:val=>Math.round(val*10)/10
},
raringsQuantity:{
    type:Number,
    default:0
},
price:{
    type:Number,
    required:[true,'a tour must have price']
},
priceDiscount:{
    type: Number,
    validate:{
        validator:function(val){
            return val<this.price;
        },
        message:'discount price ({value}) should be below rg price'
    }
},
summary:{
    type:String,
    trim:true,
    required:[true,'a tour must have a description']
},
description:{
    type:String,
    trim:true
},
imageCover:{
    type:String,
    required:[true,'a tour must have a cover image']
},
images:[String],
createdAt:{
    type:Date,
    default:Date.now(),
    select: false
},
startDates:[Date],
secretTour:{
    type:Boolean,
    default:false
},
startLocation:{
    type:{
        type:String,
        default:'Point',
        enum:['Point']
},
    coordinates:[Number],
    address:String,
    description:String
},
locations:[
    {
        type:{
        type:String,
        default:'Point',
        enum:['Point']
    },
    coordinates:[Number],
    address:String,
    description:String,
    day:Number
}
],
guides:[
    {
    type:mongoose.Schema.ObjectId,
    ref:'User'
}
]
/* reviews:[
    {
    type:mongoose.Schema.ObjectId,
    ref:'Review'
    }
] */

},
{
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
}

);
tourSchema.index({price:1,ratingsAverage:-1});
tourSchema.index({slug:1});
tourSchema.index({startLocation:'2dsphere'});
tourSchema.virtual('durationWeeks').get(function(){
    return this.duration/7;
});
tourSchema.virtual('reviews',{
    ref:'Review',
    foreignField:'tour',
    localField:'_id'
});

tourSchema.pre('save',function(next){
   // console.log(this)
   this.slug=slugify(this.name,{lower:true});
   next();
});
tourSchema.pre('save',async function(next){
    const guidesPromises=this.guides.map(async id=>await User.findById(id));
    this.guides=await Promise.all(guidesPromises);
    next();
})

tourSchema.pre(/^find/,function(next){
    this.find({secretTour:{$ne:true}});
    this.start=Date.now();
    next();
});

tourSchema.pre(/^find/,function(next){
    this.populate({
        path:'guide',
        select:'-__v -passwordChangedAt'
    });
})
tourSchema.post(/^find/,function(docs,next){
    console.log(`query took ${Date.now()-this.start}milliseconds!`);
    //console.log(docs);
    next();
});


/* tourSchema.pre('aggregate',function(next){
    this.pipeline().unshift({$match:{secretTour:{$ne:true}}});
    console.log(this.pipeline());
    next();
}); */
const Tour=mongoose.model('Tour',tourSchema);
module.exports=Tour;