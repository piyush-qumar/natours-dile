const nodemailer=require('nodemailer');

module.exports=class Email{
    constructor(user,url){
        this.to=user.email;
        this.firstName=user.name.split(' ')[0];
        this.url=url;
        this.from=`piyush kumar <${process.env.EMAIL_FROM}>`;
    }
    newTransport(){
        if(process.env.NODE_ENV==='production'){
            return 1;
        }
        return nodemailer.createTransport({
            host:process.env.EMAIL_HOST,
            port:process.env.EMAIL_PORT,
            //service:'Gmail',
            auth:{
                user:process.env.EMAIL_USERNAME,
                pass:process.env.EMAIL_PASSWORD
            }
            //ACTIVATE EMAIL
        });
    }
    async send(template,subject){
       const html= pug.renderFile(`${__dirname}/../views/email/
       ${template}.pug`,{
           firstName=this.firstName,
           url:this.url,
           subject
       });
        const mailOptions={
            from:this.from,
            to:this.to,
            subject,
            html,
            text:options.message
        };
        
        await this.newTransport().sendMail(mailOptions);

    }
    async sendWelcome(){
        await this.send('Welcome','Welcome to the family!');
    }

    async sendPasswordReset(){
        await this.send('passwordReset','Your password reset token valid for 10 min');
    }
};
