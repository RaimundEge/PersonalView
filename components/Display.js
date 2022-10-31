app.component('display', {
    template:
        /*html*/
        `<div class="display"> 
        {{ query }} contains {{ count }} items <br>
            <img @click="lightboxEffect(index)" v-for="(item, index) in items" :key="item" :src="item.thumb" class="light-box__thumbnail">
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
                        <img :key="currentImage" :src="large_path + [currentImage + 1] +'.jpg'" class="light-box__container__img" >
                    </transition>
                </div>
        
                <div class="light-box__caption" v-if="caption">
                    <p v-if="captions[currentImage]">{{ captions[currentImage]}}</p>
                </div>
        
                <div @click="next" class="light-box__next light-box__btn"></div>
            </div>
        </div>`,
    data() {
        return {
            items: null,
            bg: false,
            currentImage: 0,
            caption: true,
            large_images: [],
            captions: [],
            thumbnails_path: '',
            large_path: ''
        }
    },
    props: {
        query: {
            type: String,
            required: true
        }
      },
    methods: {
        async getItems() {
            NProgress.start()
            var resp = await axios.get('http://media:3000/?opt=' + this.query)
            // console.log(resp.data);
            this.items = resp.data.items;
            for (var item of this.items) {
                console.log(item)
                if (item.status == 'dir') {
                    item.thumb = 'assets/folder.svg'
                    this.captions.push(item.src.split('/').pop() || '')
                }
            }
            NProgress.done()
            // console.log(Object.keys(this.groups).length + " number of groups")
        },
        lightboxEffect(curr) {
            this.currentImage = curr;
            this.bg = !this.bg;
          },
          next() {
            if (this.currentImage < this.large_images.length - 1) {
              this.currentImage++;
            } else {
              this.currentImage = 0;
            }
          },
          prev() {
            if (this.currentImage > 0) {
              this.currentImage--;
            } else {
              this.currentImage = this.large_images.length - 1;
            }
          }
    },
    computed: {
      count() {
        if (this.items == null) {
          this.getItems()
          return 0
        } else {
          return this.items.length
        }
      }
    }
})
