import axios from 'axios';
import {$} from './bling';

function ajaxHeart(e) {
    e.preventDefault();
    axios
        .post(this.action) //this refers to the form tag
        .then((res) => {
            const isHearted = this.heart.classList.toggle('heart__button--hearted'); //this.heart refers to the name property in the form tag (name=heart)
            $('.heart-count').textContent = res.data.hearts.length;
            if(isHearted) {
                this.heart.classList.add('heart__button--float'); //adds the specified class for the heart float animation
                setTimeout(function() {
                    this.heart.classList.remove('heart__button--float'),
                2500});  
            }
        }).catch(console.error);
}

export default ajaxHeart;