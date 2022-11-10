app.component('display', {
  template:
    /*html*/
    `<h3>Ege Family Pictures: 
    
    <span v-for="(item,index) in query.split('/')" :key="item" @click="jumpTo(index)">
      &nbsp; <span class="query-item">{{ formatItem(item) }}</span>
    </span>
    
    &nbsp; ( {{ count }} items )</h3>
    <div class="display"> 
            <div v-for="(item, index) in items" :key="item" @click="lightboxEffect(index)" >
              <div v-if="item.status=='dir'" class="folder">
                <img :src="item.thumb" :alt="item.caption">
                <div class="folder-text">{{ item.caption }}</div>
              </div>
              <div v-if="item.status=='down'" class="thumbnail">
                <a :href="item.src"><img :src="item.thumb" :alt="item.caption"></a>
                <div class="folder-text">{{ item.caption }}</div>
              </div>
              <div v-if="!(item.status=='dir'||item.status=='down')" class="thumbnail">
                <img :src="item.thumb" :alt="item.caption" >
                <div class="thumbnail-caption">{{ item.caption }}</div>
              </div>
            </div>
            <transition name="fade" mode="out-in">
                <div @click.stop="bg = !bg" class="light-box__bg" v-if="bg"></div>
            </transition>
    
            <div v-if="bg">
                <div class="light-box__close" @click.stop="bg = !bg"></div>
                <p class="light-box__count" v-if="count">
                    {{currentImage + 1 }}/<span>{{ items.length}}</span>
                </p>
                <div @click="prev" class="light-box__prev light-box__btn"></div>
        
                <div v-if="bg" class="container">
                    <transition name="fade" mode="out-in">
                        <span v-html="show(currentImage)"></span>
                    </transition>       
                    <div class="container-caption" v-if="items[currentImage].caption">
                        <p>{{ items[currentImage].caption }}</p>
                    </div>
                </div>
                <div @click="next" class="light-box__next light-box__btn"></div>
            </div>
        </div>`,
  data() {
    return {
      query: '.',
      items: [],
      bg: false,
      currentImage: 0
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
        for (var item of this.items) {
          // console.log(item)
          item.caption = item.src.split('/').pop() || ''
          switch (item.status) {
            case 'dir':
              item.thumb = 'assets/folder.png'
              break;
            case 'wait':
              item.thumb = 'assets/waiting-small.gif'
              waiting = true
              break;
            case 'bad':
              item.thumb = 'assets/broken.png'
              // console.log('bad: ' + item.src)
              break;
            case 'other':
              item.thumb = 'assets/question-mark.png'
              break;
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
          result = '<img src="' + item.src + '" class="container-image" style="width:100%;"></img>';
          break;
        case 'video':
          result = '<video autoplay class="container-image" style="width:100%;"><source src="' + item.src + '" type="video/mp4"></video>';
          break;
        case 'dir':
          result = '<img src="assets/folder.png"/>'
          break;
      }
      return result;
    },
    lightboxEffect(curr) {
      var item = this.items[curr]
      console.log(item)
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
    }
  },
  computed: {
    count() {
      console.log(this.items)
      console.log(this.query)
      if (this.items.length === 0) {
        this.getItems()
        return 0
      } else {
        return this.items.length
      }
    }
  }
})
