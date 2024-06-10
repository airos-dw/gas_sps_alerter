// @thanks to utakata: https://dwango.slack.com/archives/C22S38FUG/p1648621620992489?thread_ts=1648620688.632749&cid=C22S38FUG

function main() {
  // 24時間以内に受診したメールを検索
  // バッチ処理の実行時間が最大1時間ブレるので、1時間の幅を持たせて25時間
  let mailSearchLimitSec = 25 * 60 * 60

  let now = new Date()
  // 現在時刻の unix timestamp （ミリ秒）
  let nowUnixTimeMilliSec = now.getTime()
  let nowUnixTimeSec = Math.floor(nowUnixTimeMilliSec/1000)
  // 24時間前の時刻（絶対時刻）
  let timeThreshold = nowUnixTimeSec - mailSearchLimitSec

  let targetMails = [];

  for (var i = 0; i < 100; i++) {
    // 1回で500個までしか検索できないので、全部取得しきるまで繰り返し取得する
    let chunkSize = 500
    // mailSearchLimitSec 以内に受信したメールに絞る
    let timeThreshold = nowUnixTimeSec - mailSearchLimitSec

    let findedThreads = GmailApp.search(
      "!list:(<p-nicovideo-sps.dwango.co.jp>) !label:メンダコ無視 subject:([SPSマルチ決済] 障害通知-購入結果通知)OR(簡易継続課金の退会処理報告) after:" + timeThreshold.toString(),
      i * chunkSize, chunkSize
    )

    let messages = GmailApp.getMessagesForThreads(findedThreads)
    for (messagesInThread of messages) {
      for (message of messagesInThread) {
        targetMails.push({
          title: message.getSubject(),
          body: message.getBody(),
        })
      }
    }
  }
  if (targetMails.length > 0) {
    callSlackApi(`■確認しときたいメールが ${targetMails.length}件 あったよ`)
    for (mail of targetMails) {
      callSlackApi('*' + mail.title + '*' + '\n```\n' + mail.body + '\n```')
    }
  }
}

function callSlackApi(message) {
  const payload = JSON.stringify({
    text: message,
  })

  // incoming webhook でSlackPOST
  const response = UrlFetchApp.fetch(
    // `https://hooks.slack.com/services/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`, // テスト用：#times_airos
    'https://hooks.slack.com/services/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', // 運用用：#ch_payment_kane
    {
      method: "post",
      contentType: "application/json",
      payload: payload,
    }
  );
  Logger.log(`${response}`)
  return response;
}
