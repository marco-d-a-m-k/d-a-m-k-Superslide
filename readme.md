# Superslide Template

## Usage

-   **`isLoop`** \*(Boolean, default: `false`)  
    Loops back to first or last slide in sticky mode.

-   **`freeMode`** \*(Boolean, default: `false`)  
    Allows free scrolling with momentum (no snap).

-   **`swipeThreshold`** \*(Number, default: `50`)  
    Sticky mode: pixels needed to trigger slide change.

-   **`slideSpeed`** \*(Number, default: `300`)  
    Duration (ms) for slide transition animations.

-   **`autoActive`** \*(Boolean, default: `false`)  
    Auto-detect & mark most visible slide as active.

-   **`changeWidth.enabled`** \*(Boolean, default: `false`)  
    Treat all slides as if they share the first slide’s width.

-   **`changeWidth.widthTransitionDuration`** \*(Number, default: `300`)  
    Duration (ms) of the width transition when `enabled`.

## PHP Setup

```php
<div class="slider">

    <nav class="slider__control" aria-label="Slider navigation">
        <button class="slider--prev" aria-label="Previous slide">
            <?php include THEME_DIR . 'parts/vectors/left.svg'; ?>
        </button>
        <button class="slider--next" aria-label="Next slide">
            <?php include THEME_DIR . 'parts/vectors/right.svg'; ?>
        </button>
    </nav>

    <ul class="slider__list">
        <?php foreach ($block['slider'] as $index => $item): ?>
            <li class="slider__litem" data-index="<?= $index ?>">
                Content
            </li>
        <?php endforeach; ?>
    </ul>

    <nav class="slider__pagination" aria-label="Slider pagination"></nav>

</div>
```

## JS Setup

```javascript
import { Slider } from "d-a-m-k-superslide";

const sliderElement = document.querySelector(".slider");
const mySlider = new Slider(sliderElement, {
    isLoop: true,
    freeMode: false,
    swipeThreshold: 50,
    slideSpeed: 300,
    autoActive: true,
    changeWidth: {
        enabled: true,
        widthTransitionDuration: 500,
    },
});
```

## CSS Setup

```css
.slider {
    display: grid;
    gap: var(--sp-6);
}

.slider__list {
    position: relative;
    display: flex;
    flex-flow: row nowrap;
    gap: var(--sp-2);

    overflow-x: scroll;

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
