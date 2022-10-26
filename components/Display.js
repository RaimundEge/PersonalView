app.component('display', {
    template:
        /*html*/
        `<div class="display"> 
            word
        </div>`,
    data() {
        return {
            temps: null,
        }
    },
    methods: {
        format(when) {
            return new Date(when).toString().slice(0, 21)
        }
    },
    computed: {
        
    }
})
