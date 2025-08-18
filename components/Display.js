app.component('display', {
  template:
    /*html*/
    `<div class="display">
      <div class="header">
        <h3>Ege Family Pictures:       
          <span v-for="(item,index) in query.split('/')" :key="item" @click="jumpTo(index)">
            &nbsp; <span class="query-item">{{ formatItem(item) }}</span>
          </span>     
          &nbsp; 
          ( {{ count }} items )
        </h3>
      </div>
      <div class="tools" @click="toggleTools()">Tools</div>
      <div v-if="tools" class="toolbox">
          <h3>{{folderName(query)}} Folder Content Analysis</h3><div class="toolbox-close" @click.stop="toggleTools()"></div>
          <button @click="countUniqueFiles()" :disabled="page!='main'">Count unique files</button>
          <div v-if="fileCount">{{ fileCount }} unique files</div>
          <div v-if="dupCount">{{ dupCount }} duplicate files</div>
          <div v-if="dupFolders.length">{{ dupFolders.length }} folders with duplicate files</div>
          <button v-if="dupCount" @click="showFolderDups()" :disabled="fileCount == 0">Show folders with duplicates</button>&nbsp;         
      </div>
      <div v-if="page=='folderDups'" class="dupFolders folderDups"> 
          <div v-for="(item, index) in dupFolders" :key="item" @click="showFolderWithDups(index)" >
            <span v-html="showDupFolder(item)"></span>
          </div>
      </div>
      <div v-if="page=='dupFolder'" class="dupFolders"> 
          <h3>{{dupFolders[currentDupFolder].name}}</h3>
          <div v-for="(item, index) in dupFolders[currentDupFolder].files" :key="item">
            <div class="dup">
                  <img class="dup-image" :src="createSrc(item)">
                  <div class="dup-content">
                    <span>Name: {{item.name}} appears in: {{item.others.length}} other folders:</span>
                    <div v-for="other in item.others" :key="other" class="dup-other">
                      <span @click="goto(other)">{{other}}</span> &nbsp;
                      <button @click="deleteDup(other, item)">Delete</button>
                    </div>
                  </div>
            </div>
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
      tools: false,     // indicates whether toolbox is open
      fileCount: 0,     // number of files in personal
      dupCount: 0,      // number of duplicate files in personal
      dupFolders: [],   // array of folders that contain duplicate files
      page: "main",     // current page content: main, dupFolder, folderDups
      NProgress: NProgress,
      onLoad: true,
      currentImage: 0,
      currentDupFolder: 0 // current folder with duplicates
    }
  },
  methods: {
    async getItems() {
      NProgress.start()
      var waiting = false;
      do {
        var resp = await axios.get('http://media:3000/?opt=' + this.query + '&waiting=' + waiting)
        // console.log(resp.data);
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
    goto(newQuery) {
      this.query = newQuery;
      this.page = "main";
      this.tools = false;
      this.getItems();
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
    showFolderDups() {
      this.getFoldersWithDuplicates();
      this.page = "folderDups";
    },
    showDupFolder(item) {
      item.caption = this.prepCaption(item.name) + ' (' + item.files.length + ')';   
      // console.log("showDupFolder: " + item.caption); 
      result = `<div class="thumb"><img src="assets/folder.png"><div class="folder-text">${item.caption}</div></div>`;
      return result;
    },
    showFolderWithDups(index) {
      this.page = "dupFolder";
      this.currentDupFolder = index;
    },
    folderName(query) {
      if (query == '.') {
        return "Home";
      } else {
        return query.slice(2);
      }
      var pieces = query.split('/');
      if (pieces.length > 1) {
        return pieces[pieces.length - 1];
      } else {
        return "Personal";
      }
    },
    createSrc(item) {
      const VIDTYPES = ["mp4", "MP4", "avi", "AVI", "MTS", "wmv", "mov", "MOV", "3gp", "webm"]
      var ext = item.name.split('.').pop() || '';
      var thumbFileName = item.name;
      if (VIDTYPES.includes(ext)) {
         thumbFileName += '.png'; // add .png to video files to create a thumbnail
      }
      result = `perCache/${this.dupFolders[this.currentDupFolder].name}/${thumbFileName}`;
      return result;
    },
    prepCaption(src) {
      var cap = src.split('/').pop() || '';
      if (cap.length > 30) {
        // console.log('cap length: ' + cap.length)
        cap = cap.substring(0,10) + ' ... ' + cap.substring(cap.length-10);
      }
      // console.log('new caption: ' + cap);
      return cap;
    },
    lightboxEffect(curr) {
      var item = this.items[curr]
      // console.log(item)
      switch (item.status) {
        case 'dir':
          this.query = this.query + '/' + item.src;
          // console.log(this.query);
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
      this.page = "main";
      this.tools = false; 
      this.fileCount = 0;
      this.dupCount = 0;  
      this.dupFolders = [];  
      this.getItems()
    },
    toggleTools() {
      this.tools = !this.tools;
      if (!this.tools) {
        this.page = "main";
      }
    },
    async countUniqueFiles() {
      // console.log("calling countUniqueFiles and waiting")
      var resp = await axios.post('http://media:3000/countUniqueFiles', { folder: this.query });
      console.log("countUniqueFiles: " + resp.data.value + " duplicates: " + resp.data.duplicates);
      this.fileCount = resp.data.value;
      this.dupCount = resp.data.duplicates;
    },
    async getFoldersWithDuplicates() {
      // console.log("getFoldersWithDuplicates")
      var resp = await axios.get('http://media:3000/getFoldersWithDuplicates');
      this.dupFolders= resp.data;
      // console.log(this.dupFolders.length + " folders with duplicates");
    },
      
    deleteDup(other, item) {
      // console.log("deleteDup: " + other + ", " + item.name);
      axios.post('http://media:3000/deleteDup', { folder: other, file: item.name })
        .then(resp => {
          console.log("deleteDup: " + other + ", " + item.name + ": " + resp.data.status);
        })
        .catch(err => {
          console.error("Error deleting duplicate:", err);
        });
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
    }
  }
})
