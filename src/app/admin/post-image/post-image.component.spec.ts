import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostImageComponent } from './post-image.component';

describe('PostImageComponent', () => {
  let component: PostImageComponent;
  let fixture: ComponentFixture<PostImageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PostImageComponent]
    });
    fixture = TestBed.createComponent(PostImageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
