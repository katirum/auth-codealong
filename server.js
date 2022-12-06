import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import crypto from 'crypto'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const mongoUrl = process.env.MONGO_URL|| "mongodb://localhost/authproject"
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true})
mongoose.Promise = Promise

// van
/* const User = mongoose.model('User', {
  name: {
    type: String,
    unique: true
  },
  email: {
    type: String,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    default: ()=> crypto.randomBytes(128).toString('hex')
  }
}) */

/* const authenticateUser = async (req, res, next) => {
  const user = await User.findOne({accessToken: req.header('Authorization')});
  if(user){
    req.user = user;
    next();
  }else{
    res.status(401).json({loggedOut:true})
  }
} */
// Defines the port the app will run on. Defaults to 8080, but can be 
// overridden when starting the server. For example:
//
//   PORT=9000 npm start
const port = process.env.PORT || 8080
const app = express()

// Add middlewares to enable cors and json body parsing
app.use(cors())
app.use(bodyParser.json())

// daniel
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  accessToken: {
    type: String,
    default: ()=> crypto.randomBytes(128).toString('hex')
  }
})

const User = mongoose.model('User', userSchema)

app.post('/register', async (req, res) => {
  const {username, password} = req.body

  try{
    const salt = bcrypt.genSaltSync();
    if(password.length < 8){
      res.status(400).json({
        success: false,
        Response: "password must be longer than 8 characters"
      });
    }else{
      const newUser = await new User({username: username, password: bcrypt.hashSync(password, salt)}).save();
      res.status(201).json({
        success: true,
        Response: {
          username: newUser.username,
          accessToken: newUser.accessToken,
          id: newUser._id
        }
      })
    }
  }catch(error){
    res.status(400).json({success: false,
      response: error})
  }
})

app.post('/login', async (req, res) => {
  const {username, password} = req.body;
  try{
    const user = await User.findOne({username});
    if(user && bcrypt.compareSync(password, user.password)){
      res.status(200).json({
        success: true,
        response: {
          username: user.username,
          id: user._id,
          accessToken: user.accessToken
      }
      })
    } else{
      res.status(400).json({success: false,
        response: "Credentials didn't match"})
    }
  }catch(error){
    res.status(500).json({success: false,
      response: error})
  }
})

const authenticateUser = async (req, res, next) =>{
  const accessToken = req.header("Authorization");
  try{
    const user = await User.findOne({accessToken: accessToken});
    if(user){
      next()
    }else{
      res.status(401).json({
        success: false,
        response: "please login"
      })
    }
  }catch(error){
    res.status(400).json({
      success: false,
      response: error
    })
  }
}

const ThoughtSchema = new mongoose.Schema({
  message:{
    type: String,
  },
  createdAt: {
    type: Date,
    default: () => new Date()
  },
  hearts:{
    type: Number,
    default: 0
  }
});

const Thought = new mongoose.model("Thought", ThoughtSchema);

app.get('/thoughts', authenticateUser);
app.get('/thoughts', (req, res) => {
  res.status(200).json({
    success: true,
    response: "all thoughts"
  })
});

// Start defining your routes here
app.get('/', (req, res) => {
  res.send('Hello world')
})

/* app.post('/users', async (req, res) => {
  try{
    const {name, email, password} = req.body;
    const user = new User({name, email, password: bcrypt.hashSync(password)});
    user.save();
    res.status(201).json({id: user._id, accessToken: user.accessToken});
  }catch(err){
    res.status(400).json({message: 'could not create user', errors: err.errors})
  }
})

app.get('/secrets', authenticateUser)
app.get('/secrets', (req, res) => {
  res.json({secret: 'this is secret'})
})

app.post('/sessions', async (req, res) => {
  const user = await User.findOne({email: req.body.email});
  if(user && bcrypt.compareSync(req.body.password, user.password)){
    res.json({userId: user._id, accessToken: user.accessToken});
  }else{
    res.json({notFound: true})
  }
}) */
// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
