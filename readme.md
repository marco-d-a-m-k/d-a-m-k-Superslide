# Superslide Template

## Usage

- **`isLoop`** _(Boolean, default: `false`)_  
  Loops back to first or last slide in sticky mode.

- **`freeMode`** _(Boolean, default: `false`)_  
  Allows free scrolling with momentum (no snap).

- **`swipeThreshold`** _(Number, default: `50`)_  
  Sticky mode: pixels needed to trigger slide change.

- **`slideSpeed`** _(Number, default: `300`)_  
  Duration (ms) for slide transition animations.

- **`autoActive`** _(Boolean, default: `false`)_  
  Auto-detect & mark most visible slide as active.

- **`changeWidth.enabled`** _(Boolean, default: `false`)_  
  Treat all slides as if they share the first slide's width.

- **`changeWidth.widthTransitionDuration`** _(Number, default: `300`)_  
  Duration (ms) of the width transition when `enabled`.

- **`clickToSlide`** _(Boolean, default: `false`)_  
  Moves to slide when it is clicked.

- **`clickZone`** _(Boolean, default: `false`)_  
  Divides each slide into two halves. Clicking the left half goes to the previous slide, clicking the right half goes to the next slide. Intended for fullscreen slides (100% width). Cannot be used together with `clickToSlide`.

- **`lang`** _(String, default: `"auto"`)_  
  Language used for accessibility labels (`aria-label`, `aria-roledescription`, etc).  
  Accepts `"de"` (German) for localized labels. `"auto"` uses the `<html lang="">` attribute.  
  All other values default to English (`"en"`).

- **Event `slideChange`**  
  Fires when a new slide becomes active (via click, swipe, or nav buttons).  
  Dispatched on the root slider DOM element.

## Methods

- **`goToSlide(index, options?)`**  
  Programmatically navigate to a slide by its zero-based index.  
  Out-of-range values are clamped to the first or last slide.

    | Option    | Type    | Default | Description                        |
    | --------- | ------- | ------- | ---------------------------------- |
    | `animate` | Boolean | `true`  | Whether to animate the transition. |

```javascript
mySlider.goToSlide(2); // go to slide 3, animated
mySlider.goToSlide(0, { animate: false }); // jump to first slide instantly
```

## PHP Setup

```php
<div class="slider" role="region" aria-roledescription="carousel" aria-label="Slideshow …">

    <nav class="slider__control" aria-label="Slider navigation">
        <button class="slider--prev" aria-label="Previous slide">
            <?php include THEME_DIR . 'parts/vectors/left.svg'; ?>
        </button>
        <button class="slider--next" aria-label="Next slide">
            <?php include THEME_DIR . 'parts/vectors/right.svg'; ?>
        </button>
    </nav>

    <ul class="slider__list" role="list" aria-live="polite">
        <?php foreach ($block['slider'] as $index => $item): ?>
            <li
            class="slider__litem"
            data-index="<?= $index ?>"
            role="group"
            aria-roledescription="Folie"
            aria-label="<?= $index . " von " . count($block['slider']) ?>"
            aria-hidden="<?= $index ? 'true' : 'false' ?>">
                Content
            </li>
        <?php endforeach; ?>
    </ul>

    <nav class="slider__pagination" aria-label="Slider pagination"></nav>

</div>
```

## JS Setup

### Single

```javascript
import { Slider } from "d-a-m-k-superslide";

const sliderElement = document.querySelector(".slider");
const mySlider = new Slider(sliderElement, {
    isLoop: true,
    freeMode: false,
    swipeThreshold: 50,
    slideSpeed: 300,
    autoActive: true,
    clickToSlide: true,
    clickZone: false,
    changeWidth: {
        enabled: false,
        widthTransitionDuration: 500,
        slideWidth: null,
    },
});

sliderElement.addEventListener("slideChange", (e) => {
    const { index, slide } = e.detail;
    console.log("Slide changed to index:", index);
    console.log("Current slide element:", slide);
});

// Navigate programmatically
mySlider.goToSlide(2);
```

### Multi

```javascript
import { Slider } from "d-a-m-k-superslide";

const sliders = Array.from(document.querySelectorAll(".slider")).map(
    (element) =>
        new Slider(element, {
            isLoop: true,
            freeMode: false,
            swipeThreshold: 50,
            slideSpeed: 300,
            autoActive: true,
            clickToSlide: true,
            clickZone: false,
            changeWidth: {
                enabled: false,
                widthTransitionDuration: 500,
                slideWidth: null,
            },
        }),
);
```

## CSS Setup

```css
.slider {
    display: grid;
    gap: var(--sp-6);

    --mg-inline: var(--sp-4);

    margin-inline: calc(var(--mg-inline) * -1);
}

.slider__list {
    position: relative;
    display: flex;
    flex-flow: row nowrap;
    gap: var(--sp-2);

    padding-inline: var(--mg-inline);

    overflow-x: scroll;
    overflow-y: hidden;

    &::-webkit-scrollbar {
        display: none;
    }

    cursor: grab;

    &:active {
        cursor: grabbing;
    }

    & .slider__litem {
        min-width: 0;
        flex: none;

        display: flex;
        flex-direction: column;
        gap: var(--sp-6);

        & img {
            pointer-events: none;
        }
    }
}

/* Navigation Styling */

.slider__control {
    & > * {
        width: var(--fs-2);
        aspect-ratio: 1/1;
    }
}

/* Pagination Styling */
.slider__pagination {
    display: flex;
    justify-content: center;
    gap: var(--sp-4);
}

.slider__pagination ul {
    display: flex;
    list-style: none;
    gap: var(--sp-4);
}

.slider__dot {
    width: var(--fs-2);
    aspect-ratio: 1/1;
    border-radius: 50%;
    background-color: var(--clr-black);
    cursor: pointer;
    transition: background-color var(--ts-2);

    @media (hover) {
        &:is(:hover, :focus-visible) {
            background-color: var(--clr-dark-grey);
        }

        &:active {
            color: var(--clr-white);
        }
    }
}

.slider__dot.active {
    background-color: var(--clr-green);
}
```
