(()=>{
  "use strict"
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
      },
      changeMinogashi: function(e){
        e.minogashi = !e.minogashi;
        $.post("./api/setAnimeStory",{
          tid: e.tid,
          count: e.count,
          minogashi: e.minogashi? 1: 0,
          comment: e.comment
        },(res)=>{
          // ローカルでも削除
          this.list = this.list.filter(anime => anime.tid != e.tid);
        });
      }
    }
  });
  /*
   * しょぼカレ仕様
   * https://sites.google.com/site/syobocal/spec/rss2-php
   *
   */
  let in_url = "./api/getAllMinogashiAnime";
  $.get(in_url, (response)=>{
    let importAnimeSet = response['body'];
    let AnimeDataSet = [];
    let count = 0;
    for(let i=0; i<importAnimeSet.length; i++){
      // console.log(importAnimeSet[i]);
      minogashiAnimeList.push(new AnimeDataDB(i, importAnimeSet[i]));
    }
  });
})();
