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
    var iframe = <iframe style="width:120px;height:240px;" marginwidth="0" marginheight="0" scrolling="no" frameborder="0" src="//ws-eu.amazon-adsystem.com/widgets/q?ServiceVersion=20070822&OneJS=1&Operation=GetAdHtml&MarketPlace=FR&source=ac&ref=qf_sp_asin_til&ad_type=product_link&tracking_id=girotomas-21&marketplace=amazon&amp;region=FR&placement=0754819094&asins=0754819094&linkId=0338015d72ccddf0f05636bd057b63c7&show_border=false&link_opens_in_new_window=false&price_color=333333&title_color=0066c0&bg_color=ffffff">
    </iframe>

    return (
      <div className="App">
        <header className="App-header">
          <p>Ask help of other users to identify the species you find!!</p>
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
