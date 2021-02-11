import React, { Component } from "react";
import FileUploader from "react-firebase-file-uploader";
import "./App.css";
import fetch from "node-fetch";
import firebase from "firebase";
var firebaseConfig = {
  apiKey: "AIzaSyCUkUHHAyYs6BmKq1rAeJ9zok-uEM1CbUI",
  authDomain: "bourse2-ec574.firebaseapp.com",
  databaseURL: "https://bourse2-ec574.firebaseio.com",
  projectId: "bourse2-ec574",
  storageBucket: "bourse2-ec574.appspot.com",
  messagingSenderId: "830358554197",
  appId: "1:830358554197:web:04ba2080e609d71b"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

export class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: "",
      avatar: "",
      isUploading: false,
      progress: 0,
      avatarURL: "",
      urls: [], 
      comments:[]
    };
  }

  componentDidMount() {
    firebase
      .firestore()
      .collection("images")
      .orderBy("date", 'desc')
      .limit(3)
      .onSnapshot(querySnapshot => {
        this.setState({urls:[]})
        querySnapshot.forEach(doc => {
          console.log(doc.id, " => ", doc.data());
          var data = doc.data()
          this.setState(
            state=>{
              state.urls.push(data)
              return state
            })
          firebase.firestore().collection('images').doc(''+data.date).collection('comments').orderBy("date", 'desc')
      .limit(5).onSnapshot(querySnapshot=>{
        this.setState(state=>{
          state.comments=state.comments.filter(c=>c.parent!=data.date)
          return state
        })
        querySnapshot.forEach(doc=>{
          var c_data=doc.data()
          this.setState(
            state=>{
              state.comments.push(c_data)
              return state
            }
          )
        })
      })
        });
      });
  }

  handleUploadStart = () => this.setState({ isUploading: true, progress: 0 });
  handleProgress = progress => this.setState({ progress });
  handleUploadError = error => {
    this.setState({ isUploading: false });
    console.error(error);
  };
  handleUploadSuccess = filename => {
    this.setState({ avatar: filename, progress: 100, isUploading: false });
    firebase
      .storage()
      .ref("images")
      .child(filename)
      .getDownloadURL()
      .then(url => {
        this.setState({ avatarURL: url });
        var date = "" + Date.now();
        firebase
          .firestore()
          .collection("images")
          .doc(date)
          .set({
            filename: filename,
            date: date,
            url: url
          });
        fetch(
          "https://us-central1-bourse2-ec574.cloudfunctions.net/notifyAllPictureUpload2?mes=" +
            "Someone needs your help to identify his insect." +
            "&icon=" +
            url
        );
      });
  };

  render() {
    //affiliate add
    var iframe = <a target="_blank"  style={{width:'80%', height:'70%'}} href="https://www.amazon.fr/gp/product/0754819094/ref=as_li_tl?ie=UTF8&camp=1642&creative=6746&creativeASIN=0754819094&linkCode=as2&tag=girotomas-21&linkId=48e5e1efe4af59b657c36f8b8c9792ec"><img border="0" src="//ws-eu.amazon-adsystem.com/widgets/q?_encoding=UTF8&MarketPlace=FR&ASIN=0754819094&ServiceVersion=20070822&ID=AsinImage&WS=1&Format=_SL250_&tag=girotomas-21" ></img></a>

    return (
      <div className="App">
        <header className="App-header">
          <p>Ask help of other users to identify the species you find!!</p>
          <p>you can buy this book at amazon by clicking on the image</p>
          {iframe}
          <form>
            <label>Upload the image of your insect:</label>
          

            <FileUploader
              accept="image/*"
              name="avatar"
              randomizeFilename
              storageRef={firebase.storage().ref("images")}
              onUploadStart={this.handleUploadStart}
              onUploadError={this.handleUploadError}
              onUploadSuccess={this.handleUploadSuccess}
              onProgress={this.handleProgress}
            />
            {this.state.isUploading && <p>progress: {this.state.progress}%</p>}
          </form>
            <div style={{display:'flex', flexDirection:'column'}}>
            {this.state.urls.map(data=>{
              return <div style={{display:'flex', flexDirection:'column'}}><img style={{maxWidth:'300px'}} src={data.url}/>
              <textarea id={data.date}></textarea>
              <button onClick={
                ()=>{
                  var text =  document.getElementById(data.date).value
                  if (text =='') return 
                  var date= Date.now()
                  firebase.firestore().collection('images').doc(data.date).collection('comments').doc(''+date).set({
                  date:date,
                  text:text,
                  parent:data.date,
                })
                  document.getElementById(data.date).value=''}
              }>Comment</button>
              {this.state.comments.filter(c=>c.parent==data.date).map(c=><p>{c.text}</p>)}
              
              </div>}
              )}</div>
          
        </header>
      </div>
    );
  }
}

export default App;
