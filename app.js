'use strict'

const {mapUser, getRandomFirstName} = require('./util')

// db connection and settings
const connection = require('./config/connection')
let userCollection
run()

async function run() {
  await connection.connect()
  await connection.get().createCollection('users')
  await connection.get().dropCollection('users')
  userCollection = connection.get().collection('users')

  await example1()
  await example2()
  await example3()
  await example4()
  await connection.close()
}

// #### Users

// - Create 2 users per department (a, b, c)
async function example1() {
  const departments = ['a', 'a', 'b', 'b', 'c', 'c']
  const users = departments.map(d => ({department: d})).map(mapUser)
  try {
    const {result} = await userCollection.insertMany(users)
    console.log(`Added ${result.n} users`)
  } catch (err) {
    console.error(err)
  }
}

// - Delete 1 user from department (a)

async function example2() {
  try {
    const {result} = await userCollection.deleteOne({department: 'a'})
    console.log(`Removed ${result.n} user`)
  } catch (err) {
    console.error(err)
  }
}

// - Update firstName for users from department (b)

async function example3() {
  try {
    // const [find, update] = [{department: 'b'}, {$set: {firstName: getRandomFirstName()}}]
    const usersB = await userCollection.find({department: 'b'}).toArray()
    const bulkWrite = usersB.map(user => ({
      updateOne: {
        filter: {_id: user._id},
        update: {$set: {firstName: getRandomFirstName()}}
      }
    }))
    const {result} = await userCollection.bulkWrite(bulkWrite)
    console.log(`Updated ${result.nModified} users`)
  } catch (err) {
    console.error(err)
  }
}

// - Find all users from department (c)
async function example4() {
  try {
    const [find, projection] = [{department: 'c'}, {firstName: 1}]
    const users = [...(await userCollection.find(find, projection).toArray())].map(mapUser)
    console.log('Users:')
    users.forEach(console.log)
  } catch (err) {
    console.error(err)
  }
}
