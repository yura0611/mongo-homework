'use strict'

const {mapArticle, getRandomFirstName} = require('./util')
const fs = require('fs');
// db connection and settings
const connection = require('./config/connection');
const { match } = require('assert');
let userCollection
let studentCollection
run_2()
//run()


// To run articles
// async function run() {
//   await connection.connect()
//   // await connection.get().createCollection('articles')
//   await connection.get().dropCollection('articles')
//   userCollection = connection.get().collection('articles')

//   await example1()
//   await example2()
//   await example3()
//   //await example4()
//   await example5()
//   await connection.close()
// }

// to run Students Statistic
async function run_2() {
  await connection.connect()
 // await connection.get().createCollection('students')
  await connection.get().dropCollection('students')
  studentCollection = connection.get().collection('students')
  const data = fs.readFileSync('students.json');
  const docs = JSON.parse(data.toString());
  await studentCollection.insertMany(docs);
  //await students1()
  //await students2() //???
  //  await students3()
  //await students4()
  //await students5()
  //await students6()
  await connection.close()
}











// - Create 5 articles per each type (a, b, c)
async function example1() {

  try {
    const types = ['a','a','a','a','a','b','b','b','b','b','c','c','c','c','c'];
     const articles = types.map(d => ({type: d})).map(mapArticle);
    try{
      const {result} = await userCollection.insertMany(articles);
      console.log( `Added ${result.n} articles`);
    }
    catch(err){
      console.log(err);
    }
  } catch (err) {
    console.error(err)
  }
}

// Find articles with type a, and update tag list with next value [‘tag1-a’, ‘tag2-a’, ‘tag3’]

async function example2() {
  try {
      const articles = await userCollection.find({type:'a'}).toArray();
      const bulkWrite = articles.map(article => ({
        updateOne: {
          filter: {_id : article._id},
          update: {$set: {tags: ['tag1-a','tag2-a','tag3-a']}}

        }
      }))
      const {result} = await userCollection.bulkWrite(bulkWrite);
      console.log (`Updated  ${result.nModified} articles`);
  } catch (err) {
    console.error(err)
  }
}

// Add tags [‘tag2’, ‘tag3’, ‘super’] to other articles except articles from type a

async function example3() {
  try {
      const articlesNeA= await userCollection.find( {type: { $ne: 'a' }}).toArray();
      const bulkWrite = articlesNeA.map(articles => ({
        updateOne: { 
          filter: {_id: articles._id},
          update: {$set: {tags: ['tag2','tag3','super']}}
        }
      }))
      const {result} = await userCollection.bulkWrite(bulkWrite);
      console.log(`Updated ${result.nModified} articles `);
  } catch (err) {
    console.error(err)
  }
}

// Find all articles that contains tags [tag2, tag1-a]
async function example4() {
  try {
      const result = await userCollection.find({tags: {$in: ['tag2','tag1-a']}}).toArray();
      console.log(result);
  } catch (err) {
    console.error(err)
  }
}

// Pull [tag2, tag1-a] from all articles
async function example5() {
  try {
      const result = await userCollection.updateMany({}, {$pull: {tags: {$in: ['tag2','tag1-a']}}});
      console.log(result);
  } catch (err) {
    console.error(err)
  }
}

//Find all students who have the worst score for homework, sort by descent
async function students1(){
  try{
      const result = await studentCollection.aggregate([
          {$unwind:"$scores"},
          {$match:{"scores.type":"homework"}},
          {$sort:{"scores.score":-1}}
      ]).toArray();
      console.log(result);
  } catch (err) {
    console.error(err);
  }
}


// Calculate the average score for homework for all students
async function students4(){
  try{
      const result = await studentCollection.aggregate([
          {$unwind:"$scores"},
          {$match:{"scores.type" : 'homework'  }},
          {$group: {
            _id: 'scores.type',
            avgScore: {$avg: "$scores.score"}
          }}
      ]).toArray();
      console.log(result);
  } catch (err) {
    console.error(err);
  }
}



// - Delete all students that have homework score <= 60
async function students5(){
  try{

      const result = await studentCollection.aggregate([
        {$unwind:"$scores"},
          {$match:{"scores.type" : 'homework', "scores.score": {$lte: 60  }}},
      ]).map(function(d){
        return d._id;
      }).toArray();
       await studentCollection.deleteMany({_id: { $in: result}});
  } catch (err) {
    console.error(err);
  }
}

// - Mark students that have quiz score => 80
async function students6(){
  try{

      const result = await studentCollection.aggregate([
        {$unwind:"$scores"},
          {$match:{"scores.type" : 'quiz', "scores.score": {$gte: 80  }}},
      ]).map(function(d){
        return d._id;
      }).toArray();
       await studentCollection.updateMany({_id: {$in: result}},{$set: {marked: 'true'}})
  } catch (err) {
    console.error(err);
  }
}

//Find all students  who have the best score for quiz and the worst for homework, sort by ascending ???
async function students2(){
  try{
    const result = await studentCollection.aggregate([
      {"$addFields":{ "scores_for_homework":{"$arrayElemAt":["$scores", 2]}}},
      {"$addFields":{ "scores_for_quiz":{"$arrayElemAt":["$scores", 1]}}},
      {$sort:{"scores_for_homework":1,"scores_for_quiz":-1}}
  ]).toArray();
   const students = await result.forEach(el=>{
     console.log(el.name);
   }) 
  } catch (err) {
    console.error(err);
  }
}



//Find all students who have best scope for quiz and exam
async function students3(){
  try{
      const result = await studentCollection.aggregate([
          {"$addFields":{ "scores_for_exam":{"$arrayElemAt":["$scores", 0]}}},
          {"$addFields":{ "scores_for_quiz":{"$arrayElemAt":["$scores", 1]}}},
          {
            $addFields: { totalScore:
              { $add: [ "$scores_for_exam.score", "$scores_for_quiz.score" ] } }
          },
          {$sort:{totalScore:-1}}
      ]).toArray();
       const students = await result.forEach(el=>{
         console.log(el.name);
       }) 
  } catch (err) {
    console.error(err);
  }
}



//Write a query that group students by 3 categories (calculate the average grade for three subjects)

async function  students7(){
  try{
          const result = await studentCollection.aggregate([
            {$unwind:"$scores"},
             {$match: {"scores.type": {$gte:0 ,$lte:60}}}
          ]).toArray()
          console.log(result);
      } catch (err) {
        console.error(err);
      }
}