app.component('display', {
  template:
    /*html*/
    `<h3>Ege Family Pictures: {{ query }} ( {{ count }} items )</h3>
    <div class="display"> 
            <div v-for="(item, index) in items" :key="item" @click="lightboxEffect(index)" >
              <div v-if="item.status=='dir'" class="folder">
                <img :src="item.thumb" :alt="item.caption" style="width: 200px">
                <div class="folder-text">{{ item.caption }}</div>
              </div>
              <div v-if="item.status=='ok'" class="thumbnail">
                <img :src="item.thumb" :alt="item.caption" >
                <div class="thumbnail-text">{{ item.caption }}</div>
              </div>
              <div v-if="item.status=='wait'">
              <img :src="item.thumb" class="light-box__thumbnail">
              {{ item.caption }}
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
        
                <div v-if="bg" class="light-box__container">
                    <transition name="fade" mode="out-in">
                        <img :key="currentImage" :src="items[currentImage].src" class="light-box__container__img" style="width:100%;">
                    </transition>
                </div>
        
                <div class="light-box__caption" v-if="items[currentImage].caption">
                    <p v-if="items[currentImage].caption">{{ items[currentImage].caption }}</p>
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
      var resp = await axios.get('http://media:3000/?opt=' + this.query)
      // console.log(resp.data);
      this.items = resp.data.items;
      for (var item of this.items) {
        // console.log(item)
        if (item.status == 'dir') {
          item.thumb = 'assets/folder.svg'
          item.caption = item.src.split('/').pop() || ''
        } else {
          if (item.status == 'ok') {
            item.caption = item.src.split('/').pop() || ''
          }
        }
      }
      NProgress.done()
      // console.log(Object.keys(this.groups).length + " number of groups")
    },
    lightboxEffect(curr) {
      var item = this.items[curr]
      console.log(item)
      if (item.status === 'dir') {
        this.query = this.query + '/' + item.src
        console.log(this.query)
        this.getItems()
      } else {
        if (item.status === 'ok') {
          this.currentImage = curr;
          this.bg = !this.bg;
        }
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
