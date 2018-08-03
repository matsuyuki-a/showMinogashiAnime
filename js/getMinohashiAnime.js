(()=>{
  "use strict"
  console.log("test");
  // アニメデータを蓄積するためのclass
  class AnimeData{
    constructor(in_set){
      this.youbi = ["日","月","火","水","木","金","土"];
      this.startTime = new Date(in_set.StTime*1000);
      this.endTime = new Date(in_set.EdTime*1000);
      this.title = in_set.Title;
      this.count = in_set.Count;
      this.channel = in_set.ChName;
      this.channelID = in_set.ChID;
      this.subTitle = in_set.SubTitle;
      this.url = in_set.Urls;
      this.topUrl = this.url.split("\t")[0];
      this.minogashi = (in_set.UPSFlag==1);
      this.tid = in_set.TID;
      this.subtitleListUrl = "http://cal.syoboi.jp/tid/"+this.tid+"/subtitle";
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
  }
  // Date型整形
  function date_format(date){
    return date.getFullYear().toString() + ('0'+(date.getMonth()+1)).slice(-2) + ('0'+date.getDate()).slice(-2) +
    ('0'+date.getHours()).slice(-2) + ('0'+date.getMinutes()).slice(-2);
  }
  // 実行部分
  let minogashiAnimeList = [];
  // Vue.js
  let app = new Vue({
    el: '#app',
    data: {
      list: minogashiAnimeList
    },
    methods:{
      minogashi: function(url){
        return url;
      }
    }
  });
  /*
   * しょぼカレ仕様
   * https://sites.google.com/site/syobocal/spec/rss2-php
   *
   */
  // 今日の日付
  let endDate = new Date();
  let endDateFormat = date_format(endDate);
  // 開始時日付
  let startDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 7,
    endDate.getHours(), endDate.getMinutes());
  let startDateFormat = date_format(startDate);
  // UPSFlag
  let userName = "hirarira617";
  let in_url = "./getShoboi.php";
  console.log(in_url);
  $.get(in_url,{
    filter: 1,
    alt: "json",
    usr: userName,
    start: startDateFormat,
    end: endDateFormat
  },(importAnimeSet)=>{
    let AnimeDataSet = [];
    let count = 0;
    for(let i=0;i<importAnimeSet.items.length;i++){
      AnimeDataSet[i] = new AnimeData(importAnimeSet.items[i]);
      if(AnimeDataSet[i].getMinogashi() ){
        let nowPushAnime = AnimeDataSet[i];
        nowPushAnime["id"] = count++;
        minogashiAnimeList.push( nowPushAnime );
      }
    }
  });
})();