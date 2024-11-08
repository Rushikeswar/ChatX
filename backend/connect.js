import mongoose from "mongoose";
mongoose.set("strictQuery",true);
async function connecttomongodb(url){
return mongoose.connect(url)
}
export {connecttomongodb}