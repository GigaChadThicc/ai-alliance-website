/*
 * 活動資料
 * ------------------------------------------------------------
 * 新增活動：複製一筆資料、修改內容，並把圖片放進 images/events/<id>/。
 * 頁面會依 date 自動判斷「即將舉行」或「活動回顧」，不需手動搬移。
 *
 * 欄位說明
 *   id           唯一代碼，建議用日期，例如 "20261001"（同時也是圖片資料夾名稱）
 *   date         活動日期，格式 "YYYY-MM-DD"
 *   type         "大師講座" 或 "推廣說明會"
 *   title        活動標題
 *   shortTitle   （選填）時間軸上顯示的短標題，建議 8 字以內
 *   series       （選填）系列名稱，顯示在標題上方
 *   speaker      （選填）講者
 *   time         活動時間，開頭的時間（例如 14:30）會用來計算頁首倒數
 *   location     活動地點
 *   summary      活動說明（即將舉行）或活動摘要（活動回顧）
 *   agenda       （選填）議程，[{ time, item }]
 *   registration （選填）報名設定，url 為 null 時顯示停用的「報名即將開放」按鈕
 *   cover        卡片封面圖（即將舉行時請放直式海報）
 *   homeImage    （選填）首頁「最新活動」使用的圖片，建議選橫式現場照；未填則用第一張照片
 *   photos       （選填）活動照片，[{ src, alt }]
 *   links        （選填）相關報導，[{ text, url }]
 */

window.EVENTS_DATA = [
    {
        id: "20261001",
        date: "2026-10-01",
        type: "大師講座",
        shortTitle: "黑幼龍董事長講座",
        series: "產業轉型論壇｜掌握變局，開創新局",
        title: "企業轉型的契機與展望",
        speaker: "黑幼龍 董事長",
        time: "14:30–18:30（18:30 起貴賓餐敘）",
        location: "劍湖山渡假大飯店 202 & 203 廳",
        summary:
            "本聯盟產業轉型論壇邀請黑幼龍董事長主講「企業轉型的契機與展望」，與企業先進一同探討在產業變局中掌握轉型契機的思維與做法，誠摯邀請會員與企業夥伴蒞臨交流。",
        agenda: [
            { time: "14:30–15:10", item: "貴賓報到與交流" },
            { time: "15:10–15:30", item: "開幕式暨貴賓致詞" },
            { time: "15:30–18:30", item: "專題座談暨觀點交流" },
            { time: "18:30–20:30", item: "貴賓餐敘" }
        ],
        registration: {
            url: null,
            note: "報名連結開放後將於本頁公告"
        },
        cover: "images/events/20261001/poster.jpg",
        photos: [],
        links: []
    },
    {
        id: "20260914",
        date: "2026-09-14",
        type: "推廣說明會",
        shortTitle: "活動推廣說明會",
        title: "雲麒數位 AI 永續轉型產學聯盟活動推廣說明會",
        time: "15:30–20:00",
        location: "三好國際酒店",
        summary:
            "雲麒數位 AI 永續轉型產學聯盟於 9 月 14 日辦理活動推廣說明會，透過聯盟介紹、合作機制與會員服務說明，向與會企業推廣專家診斷、教育訓練、產業趨勢論壇及產學交流等服務，並蒐集企業在數位 AI、節能減碳、碳盤查與永續治理等面向之需求，作為後續會員服務、技術媒合及產學合作推動之基礎。",
        agenda: [
            { time: "15:30–17:30", item: "聯盟介紹與合作機制說明" },
            { time: "17:30–20:00", item: "貴賓餐敘" }
        ],
        cover: "images/events/20260914/01.jpg",
        photos: [
            { src: "images/events/20260914/01.jpg", alt: "9/14 活動推廣說明會現場照片" },
            { src: "images/events/20260914/02.jpg", alt: "9/14 活動推廣說明會現場照片" },
            { src: "images/events/20260914/03.jpg", alt: "聯盟會員招募與政府補助計畫說明文宣" }
        ],
        links: []
    },
    {
        id: "20260729",
        date: "2026-07-29",
        type: "大師講座",
        shortTitle: "陳來助董事長講座",
        title: "從行天宮到外太空，AI 時代的產業創新",
        speaker: "台灣鈣鈦礦公司 陳來助 董事長",
        time: "14:50–18:30",
        location: "三好國際酒店 一樓國際廳",
        summary:
            "本聯盟大師講座於 7 月 29 日在三好國際酒店舉行，邀請台灣鈣鈦礦公司陳來助董事長以「從行天宮到外太空，AI 時代的產業創新」為題，分享其橫跨面板、傳統食品與新能源產業的實戰經驗。陳董事長指出，從在地民生產業到高科技與綠能，都是 AI 賦能與低碳轉型的舞台，並與企業領袖交流重塑營運體質、導入新科技與落實減碳管理的策略。",
        cover: "images/events/20260729/04.jpg",
        homeImage: "images/events/20260729/03.jpg",
        photos: [
            { src: "images/events/20260729/01.jpg", alt: "7/29 大師講座現場照片" },
            { src: "images/events/20260729/02.jpg", alt: "7/29 大師講座現場照片" },
            { src: "images/events/20260729/03.jpg", alt: "7/29 大師講座現場照片" },
            { src: "images/events/20260729/04.jpg", alt: "7/29 大師講座活動海報" }
        ],
        links: [
            {
                text: "雲科大新聞",
                url: "https://www.yuntech.edu.tw/index.php/2019-04-10-08-06-20/item/14638-ai-a"
            },
            {
                text: "經濟日報報導",
                url: "https://money.udn.com/money/story/5723/9658535"
            }
        ]
    },
    {
        id: "20260722",
        date: "2026-07-22",
        type: "推廣說明會",
        shortTitle: "合作推廣說明會",
        title: "雲麒數位 AI 永續轉型產學聯盟合作推廣說明會",
        time: "17:30–20:00",
        location: "米多利休閒農莊",
        summary:
            "雲麒數位 AI 永續轉型產學聯盟於 7 月 22 日辦理合作推廣說明會，透過聯盟服務與合作機制介紹、AI 永續轉型應用及資源分享，以及產學合作需求交流，協助企業了解數位 AI、永續治理與企業轉型相關資源，並建立後續企業診斷、技術媒合及產學合作之交流管道。",
        agenda: [
            { time: "17:30–18:30", item: "聯盟介紹與合作機制說明" },
            { time: "18:30–20:00", item: "貴賓餐敘" }
        ],
        // 挑好現場照片後，在 photos 加入照片（例如 01.jpg、02.jpg）
        cover: "images/events/20260722/04.jpg",
        photos: [
            { src: "images/events/20260722/04.jpg", alt: "7/22 合作推廣說明會活動海報" }
        ],
        links: []
    },
    {
        id: "20260527",
        date: "2026-05-27",
        type: "大師講座",
        shortTitle: "黃冠華執董講座",
        title: "旭榮集團如何走向 ACE 之路！AI、Coach、ESG",
        speaker: "旭榮集團 黃冠華 執行董事",
        time: "14:30–17:30",
        location: "劍湖山渡假大飯店 202、203 廳",
        summary:
            "本聯盟首場大師講座於 5 月 27 日在劍湖山渡假大飯店舉行，邀請旭榮集團黃冠華執行董事以「旭榮集團如何走向 ACE 之路！」為題，從 AI 智慧應用、Coach 組織賦能與 ESG 永續治理三個面向，分享紡織供應鏈的轉型實務。黃執董指出，AI 導入須同步調整現場經驗、組織流程與決策模式，由下而上累積轉型能力。活動吸引多位中部企業董事長與高階主管參與交流。",
        cover: "images/events/20260527/04.jpg",
        photos: [
            { src: "images/events/20260527/01.jpg", alt: "5/27 大師講座現場照片" },
            { src: "images/events/20260527/02.jpg", alt: "5/27 大師講座現場照片" },
            { src: "images/events/20260527/03.jpg", alt: "5/27 大師講座現場照片" },
            { src: "images/events/20260527/04.jpg", alt: "5/27 大師講座活動海報" }
        ],
        links: [
            {
                text: "雲科大新聞",
                url: "https://www.yuntech.edu.tw/index.php/2019-04-10-08-06-20/item/14369-ai-ace"
            },
            {
                text: "ETtoday 報導",
                url: "https://www.ettoday.net/news/20260527/3173160.htm"
            },
            {
                text: "PChome 新聞報導",
                url: "https://news.pchome.com.tw/living/cna/20260527/index-17798698124400418009.html"
            }
        ]
    }
];
