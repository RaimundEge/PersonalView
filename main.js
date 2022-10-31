const app = Vue.createApp({
    data() {
      return {
        lightbox: {
          images: {
            thumbnails: ["1.jpg", "2.jpg", "3.jpg"],
            large: ["1.jpg", "2.jpg", "3.jpg"]
          },
          captions: ["caption 1", "Caption 2", "caption 3"],
          thumbnailsPath: "assets/sea/thumbnails/",
          largePath: "assets/sea/large/"
        }
      }
    }
  })