export class Article   {
        title: string;
        link: string;
        image: string;
        excerpt: string;
        content: string;
        order: number;
        constructor(title: string = '', order: number, image: string = '', excerpt: string = '', link: string = '', content: string = ''){
                this.title = title;
                this.link = link;
                this.image = image;
                this.excerpt = excerpt;
                this.content = content;
                this.order = order;
            }
        
    };

