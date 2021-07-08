const express = require('express')
const router = new express.Router()
const auth = require('../middleware/auth.js')
const Task = require('../models/task.js')

router.post('/tasks', auth, async (req,res)=>{
    // const task = new Task(req.body)
    const task = new Task({
        ... req.body,
        UserId: req.user._id
    })
    try{
        await task.save()
        res.status(201).send(task)
    } catch (e){
        res.status(400).send(e)
    }
})

router.get('/tasks',auth,async (req,res)=>{
    const match = {}
    const sort = {}
    if(req.query.completed){
        match.completed = req.query.completed === 'true'
    }
    if(req.query.sortBy){
        const part = req.query.sortBy.split('_')
        sort[part[0]] = part[1] === 'desc' ? -1 : 1
    }
    try{
        // const task = await Task.find({UserId: req.user._id})
        await req.user.populate({
            path:'tasks', 
            match, 
            options:{
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
            }).execPopulate()
        res.send(req.user.tasks)
    }catch(e){
        res.status(500).send()
    }
})

router.get('/tasks/:id',auth,async (req,res)=>{
    try{
        const task = await Task.findOne({_id: req.params.id, UserId: req.user._id})
        if(!task){
            return res.status(404).send()
        }
        res.send(task)
    }catch(e){
        res.status(500).send()
    }
})

router.patch('/tasks/:id',auth, async (req,res)=>{
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description','completed']
    const isValidOperator = updates.every((update)=>{
        return allowedUpdates.includes(update)
    })
    if(!isValidOperator){
        res.status(400).send({error:'Is not a valid update'})
    }
    try{
        const task = await Task.findOne({_id: req.params.id, UserId: req.user._id})
        if(!task){
            res.status(404).send()
        }
        updates.forEach((update)=>{
            task[update] = req.body[update]
        })
        await task.save()
        res.send(task)
    }catch(e){
        res.status(400).send(e)
    }
})

router.delete('/tasks/:id', auth, async (req,res)=>{
    try{
        const task = Task.findOne({_id: req.params.id, UserId: req.user._id})
        if(!task){
            res.status(404).send()
        }
        res.send(task)
    }catch(e){
        res.status(500).send()
    }
})

module.exports = router
