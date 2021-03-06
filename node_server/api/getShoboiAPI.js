"use strict";
const request = require('request-promise');
const username = process.env.ANIME_SHOBOI_CALENDAR_USERNAME;
const parser = require('fast-xml-parser');

/**
 * しょぼいカレンダーAPIにアクセスするルーティングを実装する
 */

 // しょぼいカレンダーより任意の日付の見るアニメを取得
exports.getAnyDay = (router, animeModel) => {
  router.get("/getShoboiAnimeAnyDay/", (req, res)=>{
    const shoboiHost = "http://cal.syoboi.jp/";
    const accessURL = shoboiHost + "rss2.php";
    let animeList;
    let options = {
      filter: req.query.filter,
      alt: req.query.alt,
      usr: username,
      start: req.query.start,
      end: req.query.end
    }
    request.get({
      url: accessURL,
      qs: options
    })
    .then((response)=>{
      animeList = JSON.parse(response);
      // アニメのTID_LISTを取得
      let tidlist = [];
      for(let i=0; i<animeList['items'].length; i++){
        tidlist.push(animeList['items'][i].TID);
      }
      return animeModel.about.getAnimeList(tidlist);
    })
    .then((response)=>{
      for(let i=0; i<animeList['items'].length; i++){
        let match = null;
        for(let j=0; j<response.length; j++){
          if(animeList['items'][i]['TID'] == response[j]['tid']){
            match = j;
            break;
          }
        }
        // アニメの概要がなければDBに登録
        if(match === null){
          let options = {
            tid: animeList['items'][i]['TID'],
            title: animeList['items'][i]['Title'],
            chName: animeList['items'][i]['ChName'],
            url: animeList['items'][i]['Urls']
          }
          // TODO: ここで正常に挿入できたかPromiseの結果を見たい
          animeModel.about.insertAnimeAbout(options);
        }
        // アニメの概要があればDBの情報とマージ
        else{
          animeList['items'][i]['hashTag'] = response[match]['hashTag'];
          animeList['items'][i]['characterURL'] = response[match]['characterURL'];
        }
      }
      let searchStoryList = [];
      for(let i=0; i<animeList['items'].length; i++){
        let story = {}
        story.tid = animeList['items'][i].TID;
        story.count = animeList['items'][i].Count;
        searchStoryList.push(story);
      }
      // 各話の見逃し情報を取得
      return animeModel.story.getAnimeStories(searchStoryList);
    })
    .then((response)=>{
      // animeStory の見逃し情報を animeListに入れる
      // DB未登録のリスト
      let noRegistrationStoryList = [];
      for(let anime of animeList['items']){
        // subTitleはnullの場合があるので対応
        const registAnimeSubTitle = anime.SubTitle? anime.SubTitle: '';
        let isNoMatch = true;
        for(let story of response){
          if(anime.TID == story.dataValues.tid && anime.Count == story.dataValues.count){
            anime.minogashi = story.dataValues.minogashi;
            anime.comment = story.dataValues.comment;
            isNoMatch = false;
            // サブタイが更新されていたらDBを更新する
            if(anime.SubTitle != story.dataValues.subTitle){
              console.log(anime);
              console.log(story.dataValues);
              let options = {
                tid: story.dataValues.tid,
                count: story.dataValues.count,
                subTitle: registAnimeSubTitle
              }
              console.log(options);
              animeModel.story.updateSubTitle(options);
            }
            break;
          }
        }
        // DB未登録なら、登録リストに入れておく
        // 話数がnullのアニメは登録しない
        if(isNoMatch && anime.Count != null){
          let ngStory = {
            tid: anime.TID,
            count: anime.Count,
            stTime: anime.StTime,
            edTime: anime.EdTime,
            lastUpdate: anime.LastUpdate,
            subTitle: registAnimeSubTitle
          }
          noRegistrationStoryList.push(ngStory);
        }
      }
      console.log(noRegistrationStoryList);
      // 未登録のアニメリストをDBに登録する
      animeModel.story.insertAnimeStories(noRegistrationStoryList);
      // TODO: animeStory のサブタイトルの更新があったらUpdate
      res.header('Content-Type', 'application/json');
      res.send(animeList);
    });
  });
}

// 未登録のアニメのサブタイを取得して登録
exports.getNoRegistStories = (router, animeModel) => {
  router.get("/getNoRegistStories/:tid", (req, res)=>{
    const base_url = "http://cal.syoboi.jp/db.php?Command=TitleLookup&TID=";
    const tid = req.params.tid;
    const url = base_url + tid;
    let storyList = [];
    let baseStory = {
      tid: tid,
      count: null,
      stTime: 0,
      edTime: 0,
      lastUpdate: 0,
      subTitle: ''
    }
    // ベースとなるレスポンス
    let res_body = {
      status: 'ok',
      comment: '',
      regStories: []
    };
  
    request.get({
      url: url
    })
    .then((stories)=>{
      let json = parser.parse(stories);
      let titleItem = json['TitleLookupResponse']['TitleItems']['TitleItem'];
      let subTitleLines = titleItem['SubTitles'].split("\r\n");
      for(let i in subTitleLines){
        storyList.push( subTitleLines[i].split(/\*(.*?)\*/).filter(e => e) );
      }
      return animeModel.story.getAllAnimeStory(tid);
    })
    .then((noRegStoriesDefault)=>{
      res.header('Content-Type', 'application/json');
      let registStoryList = noRegStoriesDefault.map(x => x['dataValues']);
      let existStoryList = registStoryList.map(x => x['count']);
      // 1話も登録されていない場合にはエラーとする
      if(existStoryList.length <= 0){
        return 1;
      }
      let noRegStories = [];
      let updateStories = [];
      for(let i=0; i<storyList.length; i++){
        // DB上に含まれてるかチェック
        storyList[i][0] = Number(storyList[i][0])
        if(existStoryList.indexOf( storyList[i][0] ) == -1){
          let noRegStory = Object.assign({}, baseStory);
          noRegStory['count'] = storyList[i][0];
          noRegStory['subTitle'] = storyList[i][1];
          noRegStories.push(noRegStory);
        }
        else{
          // DB上のサブタイが最新のものかチェック
          let registedStory = registStoryList.find(x => x.count == storyList[i][0]);
          // DB上のサブタイとAPI取得のサブタイが異なる場合
          if(registedStory && (storyList[i][1] != registedStory.subTitle)){
            updateStories.push({
              tid: registedStory.tid,
              count: registedStory.count,
              subTitle: storyList[i][1]
            });
          }
        }
      }
      // 登録するアニメがない場合
      if(noRegStories.length == 0 && updateStories.length == 0){
        return 2;
      }
      else{
        for(let i=0; i<updateStories.length; i++){
          // アニメのサブタイを更新（返り値は無視）
          animeModel.story.updateSubTitle(updateStories[i]);
        }
        if(noRegStories.length != 0){
          res_body['regStories'] = noRegStories;
          return animeModel.story.insertAnimeStories(noRegStories);
        }
      }
    })
    .then((regResult)=>{
      switch (regResult) {
        case 1:
          res.status(400);
          res_body['status'] = 'ng';
          res_body['comment'] = 'The anime is unregistered';
          break;
        case 2:
          res_body['comment'] = 'There is no anime to register';
          break;
        default:
          res_body['comment'] = 'All registered successfully';
        break;
      }
      res_body['date'] = new Date();
      res.send(res_body);
    });
  });
}