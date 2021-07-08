const express = require('express')
const router = new express.Router()
const User = require('../models/users.js')
const auth = require('../middleware/auth.js')
const multer = require('multer')
const sharp = require('sharp')
const {sendWelcomeEmail,sendCancelationEmail} = require('../emails/account.js')

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req,file,cb){
        if(!file.originalname.match(/\.(png|jpg|jpeg)$/)){
            return cb(new Error('Please upload an image'))
        }
        cb(undefined,true)
    }

    
})

router.post('/users', async (req,res)=>{
    const user = new User(req.body)
    try{
        await user.save()
        sendWelcomeEmail(user.email,user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({user,token})
    } catch(e){
        res.status(400).send(e)
    }

})

router.post('/users/login', async (req,res)=>{
    try{
        const user = await User.findByCredentials(req.body.email,req.body.password)
        const token = await user.generateAuthToken()
        res.send({user,token})
    }catch(e){
        res.status(400).send()
    }
})

router.post('/users/logout', auth, async (req,res)=>{
    try{
        req.user.tokens = req.user.tokens.filter((token)=>{
            return token.token !== req.token
        })
        await req.user.save()
        res.send()
    }catch(e){
        res.status(500).send()
    }
})

router.post('/users/logoutAll',auth,async(req,res)=>{
    try{
        req.user.tokens =[]
        await req.user.save()
        res.send()
    }catch(e){
        res.status(500).send()
    }
})

router.post('/users/me/avatar',auth,upload.single('avatar'),async (req,res)=>{
    const buffer = await sharp(req.file.buffer).resize({width:250,height:250}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
},(error,req,res,next)=>{
    res.status(400).send({error: error.message})
})

router.delete('/users/me/avatar',auth,async (req,res)=>{
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

router.get('/users/:id/avatar', async(req,res)=>{
    try{
        const user = await User.findById(req.params.id)
        if(!user || !user.avatar){
            throw new Error()
        }
        res.set('Content-type','image/png')
        res.send(user.avatar)
    }catch(e){
        res.status(404).send()
    }
})

router.get('/users',auth,async (req,res)=>{
    try{
        const user = await User.find({})
        res.send(user)
    }catch(e){
        res.status(500).send()
    }
})

router.get('/users/me',auth,async (req,res)=>{
    res.send(req.user)
})

// router.get('/users/:id',async (req,res)=>{
//     try{
//         const user = await User.findById(req.params.id)
//         if(!user){
//             return res.status(404).send()
//         }
//         res.send(user)
//     }catch(e){
//         res.status(500).send()
//     }
// })

// router.patch('/users/:id',async (req,res)=>{
//     const updates = Object.keys(req.body)
//     const allowedUpdates = ['name','email','password','age']
//     const isValidOperator = updates.every((update)=>{
//         return allowedUpdates.includes(update)
//     })
//     if(!isValidOperator){
//         res.status(400).send({error:'Is not a valid update'})
//     }
//     try{
//         const user = await User.findById(req.params.id)
//         updates.forEach((update)=>{
//             user[update] = req.body[update]
//         })
//         await user.save()
//         if(!user){
//             res.status(404).send()
//         }
//         res.send(user)
//     }catch(e){
//         res.status(400).send(e)
//     }
// })

router.patch('/users/me',auth, async (req,res)=>{
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name','email','password','age']
    const isValidOperator = updates.every((update)=>{
        return allowedUpdates.includes(update)
    })
    if(!isValidOperator){
        res.status(400).send({error:'Is not a valid update'})
    }
    try{
        updates.forEach((update)=>{
            req.user[update] = req.body[update]
        })
        await req.user.save()
        res.send(req.user)
    }catch(e){
        res.status(400).send(e)
    }
})

// router.delete('/users/:id', async (req,res)=>{
//     try{
//         const user = await User.findByIdAndDelete(req.params.id)
//         if(!user){
//             res.status(404).send()
//         }
//         res.send(user)
//     }catch(e){
//         res.status(500).send()
//     }
// })

router.delete('/users/me', auth ,async (req,res)=>{
    try{
        await req.user.remove()
        sendCancelationEmail(req.user.email,req.user.name)
        res.send(req.user)
    }catch(e){
        res.status(500).send()
    }
})

module.exports = router
