const mongoose = require('mongoose');
const { isEmail } = require('validator');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:[true, 'Please enter an username'],
        unique:true,
        lowercase:true,
        // validate:[ isEmail, 'Please enter a valid username']
    },
    password:{
        type:String,
        required:[true, 'Please enter an Password'],
        minlength:[6, 'Minimum password length is 6 characters']
    }
});

//hashing before saving the data to the database
userSchema.pre('save', async function(next){
    //hashing password
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password,salt);
    next();
});

//to login user
userSchema.statics.login = async function(username,password){
    const user = await this.findOne({username});
    if(user){
        const auth = await bcrypt.compare(password , user.password);
        if(auth){
            return user;
        }
        throw Error('Incorrect password');
    }
    throw Error('Incorrect username');
}

const User = mongoose.model('user', userSchema);
module.exports = User;