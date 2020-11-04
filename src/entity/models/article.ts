export class Article   {
        // private _title: String;
        // private _link: String;
        // private _image: String;
        // private _excerpt: String;
        // constructor(title: String = '', link: String = '', image: String = '', excerpt: String = ''){
        //     this._title = title;
        //     this._link = link;
        //     this._image = image;
        //     this._excerpt = excerpt;
        // }
        
        // get link() {
        //     return this.link;
        // }

        // set image(image: String){
        //     this._image = image;
        // }

        // set excerpt(excerpt: String){
        //     this._excerpt = excerpt;
        // }
        title: String;
        link: String;
        image: String;
        excerpt: String;
        constructor(title: String = '', link: String = '', image: String = '', excerpt: String = ''){
                this.title = title;
                this.link = link;
                this.image = image;
                this.excerpt = excerpt;
            }
    };

