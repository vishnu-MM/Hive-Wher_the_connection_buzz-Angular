import {Component, ElementRef, Input, Renderer2} from '@angular/core';
import {Post} from "../posts/posts.component";

@Component({
  selector: 'single-post',
  templateUrl: './single-post.component.html',
  styleUrls: ['./single-post.component.css']
})
export class SinglePostComponent {
  @Input("post") post! : Post;
  aspectRatioClass: string = '';

  constructor(private elementRef: ElementRef, private renderer: Renderer2) {}

  ngAfterViewInit(): void {
    const img = new Image();
    img.src = this.elementRef.nativeElement.querySelector('.post-image').src;
    img.onload = () => {
      const aspectRatio = img.width / img.height;
      this.calculateAspectRatioClass(aspectRatio);
    };
  }

  private calculateAspectRatioClass(aspectRatio: number): void {
    if (aspectRatio > 1.5) {
      this.aspectRatioClass = 'aspect-ratio-16-9';
    } else if (aspectRatio < 0.6) {
      this.aspectRatioClass = 'aspect-ratio-9-16';
    } else if (aspectRatio < 1 && aspectRatio >= 0.8) {
      this.aspectRatioClass = 'aspect-ratio-4-5';
    } else {
      this.aspectRatioClass = 'aspect-ratio-1-1';
    }
  }
}
