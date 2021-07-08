const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = mongoose.Schema({
    name: {
        type: String,
        require: true,
        trim: true

    },
    email:{
        type: String,
        require: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Email is invalid')
            }

        }

    },
    password:{
        type: String,
        require: true,
        minlength: 7,
        trim: true,
        validate(value){
            if(value.toLowerCase().includes('password')){
                throw new Error('Invalid password.')
            }
        }


    },
    age: {
    type: Number,
    default: 0,
    validate(value){
        if(value < 0 ){
            throw new Error('Age must be greater than 0.')
        }
    }
    },
    tokens: [{
        token:{
            type:String,
            require: true
        }
    }],
    avatar: {
        type: Buffer
    }
},{
    timestamps: true
})

userSchema.virtual('tasks',{
    ref: 'Task',
    localField: '_id',
    foreignField: 'UserId'

})

userSchema.methods.toJSON = function(){
    const user = this
    const userObject = user.toObject()
    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar
    return userObject
}

userSchema.methods.generateAuthToken = async function(){
    const user = this
    const token = jwt.sign({_id: user._id.toString()},process.env.JWT_SECRETE)
    user.tokens = user.tokens.concat({token})
    await user.save()
    return token
}

userSchema.statics.findByCredentials = async (email,password)=>{
    const user = await User.findOne({email})
    if (!user){
        throw new Error('Unable to loggin.')
    }
    const isMatched = await bcrypt.compare(password,user.password)
    if(!isMatched){
        throw new Error('Unable to loggin')
    }
    return user
}



userSchema.pre('save', async function(next){
    const user = this
    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8)
    }
    next() 
})

userSchema.pre('remove', async function(next){
    const user = this
    await Task.deleteMany({UserId: user._id})
    next()
})

const User = mongoose.model('User',userSchema)


module.exports = User
