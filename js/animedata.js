class AnimeData{
  constructor(id, in_set){
    this.id = id;
    this.youbi = ["日","月","火","水","木","金","土"];
    this.startTime = new Date(in_set.StTime*1000);
    this.endTime = new Date(in_set.EdTime*1000);
    this.title = in_set.Title;
    this.count = in_set.Count;
    this.channel = in_set.ChName;
    this.channelID = in_set.ChID;
    this.subTitle = in_set.SubTitle;
    this.hashTag = in_set.hashTag;
    this.minogashi = in_set.minogashi;
    this.comment = in_set.comment;
    this.url = in_set.Urls;
    this.characterURL = in_set.characterURL;
    this.topUrl = this.url.split("\t")[0];
    this.minogashi_sb = (in_set.UPSFlag==1);
    this.tid = in_set.TID;
    this.subtitleListUrl = "http://cal.syoboi.jp/tid/"+this.tid+"/subtitle";
    this.commentURL = "./setComment.html?tid="+this.tid+"&count="+this.count;
    this.setCountDown();
  }
  showInfo(){
    let outstr = "タイトル："+this.title+"\n";
    if(this.count !== null){
        outstr += "#"+this.count+"：";
    }
    if(this.subTitle !== null){
      outstr += this.subTitle+"\n";
    }
    outstr += "放送日："  +(this.startTime.getMonth()+1) + "月" + this.startTime.getDate() + "日(" + YOUBI[ this.startTime.getDay() ] + ")\n";
    outstr += "放送時刻："+this.startTime.getHours()+":"+this.startTime.getMinutes()+"\n";
    if(this.channel !== null){
        outstr += "放送局:"+this.channel+"\n";
    }
    outstr += "公式サイト："+this.url+"\n";
    outstr += "チェック用URL：" + this.subtitleListUrl + "\n";
    // console.log(outstr);
    return outstr;
  }
  seikeiTime(num){
    return num<10? '0'+num: num+'';
  }
  getMinogashi(){
    return this.minogashi;
  }
  setCountDown(){
    this.countDown = new Date( Math.abs( this.startTime - Date.now() ) );
    return null;
  }
}
