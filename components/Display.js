app.component('display', {
  template:
    /*html*/
    `<div class="display">
      <div class="header">
        <h3>Ege Family Pictures:       
        <span v-for="(item,index) in query.split('/')" :key="item" @click="jumpTo(index)">
          &nbsp; <span class="query-item">{{ formatItem(item) }}</span>
        </span>     
        &nbsp; ( {{ count }} items , {{ uniqueCount }} unique files )</h3>
      </div>
      <div class="tools" @click="toggleTools()">Tools</div>
      <div v-if="tools" class="toolbox">
          <h3>Available Tools</h3><div class="toolbox-close" @click.stop="toggleTools()"></div>
          <span style="display: flex">
          <button @click="checkDuplicates()" :disabled="dupActive">Check for duplicate items</button>&nbsp;
          <button @click="getCount()">Refresh</button>&nbsp;
          <div v-if="currentCount != 0"> {{currentCount}} files</div>
          </span>
          <button v-if="currentCount != 0" @click="getDuplicates()" :disabled="dupActive">Get duplicates</button>
          <button v-if="dupFolders.length != 0" @click="showDuplicates()" :disabled="dupActive">Show duplicates</button>
      </div>
      <div v-if="dupFolders.length != 0" class="thumb-area"> 
          <div v-for="(item, index) in dupFolders" :key="item">
            <span v-html="showDupFolder(item)"></span>
          </div>
      </div>
      <div v-if="page=='main'" class="thumb-area"> 
          <div v-for="(item, index) in items" :key="item" @click="lightboxEffect(index)" >
            <span v-html="showThumb(item)"></span>
          </div>
      </div>
    </div>  

    <div v-if="bg" class="lightbox">
      <transition name="fade" mode="out-in">
        <div @click.stop="bg = !bg" class="background" v-if="bg"></div>
      </transition>
      <p class="lightbox-count" v-if="count">
          {{currentImage + 1 }}/<span>{{ items.length}}</span>
      </p>
      <div class="lightbox-close" @click.stop="bg = !bg"></div>
      <div @click="prev" class="lightbox-prev lightbox-btn"></div>
      <div @click="next" class="lightbox-next lightbox-btn"></div>
      <transition name="fade" mode="out-in">
        <div class="container">
          <div v-html="show(currentImage)"></div>              
          <div class="container-caption" v-if="items[currentImage].caption">
              <p>{{ items[currentImage].caption }}</p>
          </div>
        </div> 
      </transition>              
    </div>`,
  data() {
    return {
      query: '.',
      items: [],
      bg: false,
      tools: false,   // indicates whether toolbox is open
      dupActive: false, // indicates whether file occurrences are being checked
      currentCount: 0,  // number of unique files in personal
      dupFolders: [],   // array of folders that contain duplicate files
      page: "main",     // current page content: main, dupFolder, folderDups
      NProgress: NProgress,
      onLoad: true,
      currentImage: 0
    }
  },
  methods: {
    async getItems() {
      NProgress.start()
      var waiting = false;
      do {
        var resp = await axios.get('http://media:3000/?opt=' + this.query + '&waiting=' + waiting)
        console.log(resp.data);
        waiting = false
        this.items = resp.data.items;
        if (this.items) {
          for (var item of this.items) {
            // console.log(item)
            if (item.status == 'wait') {
              waiting = true;
            }
          }
        }
        // console.log('start waiting')
        await new Promise(r => setTimeout(r, 1000));
        // console.log('done waiting')
      } while (waiting)
      NProgress.done()
      // console.log(Object.keys(this.groups).length + " number of groups")
    },
    show(index) {
      var result = '';
      var item = this.items[index];
      switch (item.status) {
        case 'image':
          result = '<img src="' + item.src + '" class="container-image"></img>';
          break;
        case 'video':
          result = '<video autoplay class="container-image"><source src="' + item.src + '" type="video/mp4"></video>';
          break;
        case 'dir':
          result = '<img src="assets/folder.png"/>'
          break;
      }
      return result;
    },
    showThumb(item) {
      var result = '';
      item.caption = this.prepCaption(item.src);
      switch (item.status) {
        case 'down':
          result = `<div class="thumb"><a href="${item.src}"><img src="${item.thumb}"></a><img src="assets/download.png" class="thumb-icon"><div class="thumb-caption">${item.caption}</div></div>`;
          break;
        case 'dir':
          result = `<div class="thumb"><img src="assets/folder.png"><div class="folder-text">${item.caption}</div></div>`;
          break;
        case 'wait':
          result = `<div class="thumb"><img src="assets/waiting.gif"><div class="thumb-caption">${item.caption}</div></div>`;
          break;
        case 'bad':
          result = `<div class="thumb"><img src="assets/broken.png"><div class="thumb-caption">${item.caption}</div></div>`;
          break;
        case 'other':
          result = `<div class="thumb"><img src="assets/question.png"><div class="thumb-caption">${item.caption}</div></div>`;
          break;
        case 'audio':
          result = `<div class="thumb"><a href="${item.src}"><img src="assets/audio.gif"><img src="assets/download.png" class="thumb-icon"></a><div class="thumb-caption">${item.caption}</div></div>`;
          break;
        default:
          result = `<div class="thumb"><img src="${item.thumb}"><div class="thumb-caption">${item.caption}</div></div>`;
      }
      // console.log('result: ' + result)
      return result;
    },
    showDupFolder(item) {
      item.caption = this.prepCaption(item.name);    
      result = `<div class="thumb"><img src="assets/folder.png"><div class="folder-text">${item.caption}</div></div>`;
      return result;
    },
    prepCaption(src) {
      var cap = src.split('/').pop() || '';
      if (cap.length > 30) {
        // console.log('cap length: ' + cap.length)
        cap = cap.substring(0,10) + ' ... ' + cap.substring(cap.length-10);
      }
      
      return cap;
    },
    lightboxEffect(curr) {
      var item = this.items[curr]
      // console.log(item)
      switch (item.status) {
        case 'dir':
          this.query = this.query + '/' + item.src;
          console.log(this.query);
          this.getItems();
          break;
        case 'image':
        case 'video':
          this.currentImage = curr;
          this.bg = !this.bg;
          break;
      }
    },
    next() {
      if (this.currentImage < this.items.length - 1) {
        this.currentImage++;
      } else {
        this.currentImage = 0;
      }
    },
    prev() {
      if (this.currentImage > 0) {
        this.currentImage--;
      } else {
        this.currentImage = this.items.length - 1;
      }
    },
    formatItem(item) {
      return (item == '.') ? "Home" : item
    },
    jumpTo(index) {
      // console.log('old: ' + this.query + ", index: " + index)
      pieces = this.query.split("/")
      var l = pieces.length
      for (var i = 1; i < (l - index); i++) {
        pieces.pop()
      }
      this.query = '.'
      for (var q of pieces) {
        if (q !== '.') {
          this.query += '/' + q
        }
      }
      // console.log('new: ' + this.query)
      this.getItems()
    },
    toggleTools() {
      this.tools = !this.tools;
      if (!this.tools) {
        this.page = "main";
      }
    },
    async checkDuplicates() {
      console.log("checkDuplicates")
      this.dupActive = true;
      this.getCount();
      var resp = await axios.get('http://media:3000/checkDuplicates');
      console.log(resp.data);
      // this.dupActive = false;
    },
    getCount() {          
      console.log("getCount")
      axios.get('http://media:3000/getCount').then(resp => {
        console.log(resp.data);
        this.currentCount = resp.data.value; 
      }).catch(err => {
        console.error("Error fetching count:", err);
      });       
    },
    async getDuplicates() {
      console.log("getDuplicates")
      var resp = await axios.get('http://media:3000/getDuplicates');
      console.log(resp.data); 
      this.dupFolders= resp.data;
    }
  },
  computed: {
    count() {
      // console.log(this.items)
      // console.log(this.query)
      if (this.onLoad) {
        this.onLoad = false;
        this.getItems()
        return 0
      } else {
        return this.items.length
      }
    },
    uniqueCount() {
      console.log("uniqueCount")
      return this.currentCount;
    }
  }
})
