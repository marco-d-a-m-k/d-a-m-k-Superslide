import Hammer from "hammerjs";

class Slider {
    constructor(sliderElement, config = {}) {
        this.sliderElement = sliderElement;
        this.config = {
            isLoop: false,
            freeMode: false,
            swipeThreshold: 50,
            slideSpeed: 300,
            autoActive: false,
            clickToSlide: true,
            changeWidth: {
                enabled: false,
                widthTransitionDuration: 300,
            },
            ...config,
        };
        this.sliderList = sliderElement.querySelector(".slider__list");
        if (!this.sliderList) return;
        this.prevButton = sliderElement.querySelector(".slider--prev");
        this.nextButton = sliderElement.querySelector(".slider--next");
        this.paginationContainer = sliderElement.querySelector(
            ".slider__pagination"
        );

        // Store all slides, but we will determine which ones are visible dynamically.
        this.slides = Array.from(this.sliderList.children);

        // Find first visible slide at initialization
        this.currentIndex = this.findFirstVisibleSlide();

        this.animationId = null;
        this.isDragging = false;

        if (this.config.changeWidth.enabled && this.slides.length > 0) {
            this.initialSlideWidth = this.slides[0].offsetWidth;
        }

        const sliderListStyles = window.getComputedStyle(this.sliderList);
        this.flexGap = parseInt(sliderListStyles.gap, 10) || 0;
        this.init();
    }

    init() {
        this.setupAccessibility();
        if (this.prevButton && this.nextButton) {
            this.setupNavigation();
        }
        if (this.paginationContainer) {
            this.setupPagination();
        }
        this.setupSwipe();
        this.setupKeyboardNavigation();
        if (this.config.clickToSlide) {
            this.setupSlideClick();
        }
    }

    /**
     * Finds the first visible slide in the DOM.
     * Returns the index of the first visible slide or 0 if none are found.
     */
    findFirstVisibleSlide() {
        const firstVisibleIndex = this.slides.findIndex((slide) =>
            this.isSlideVisible(slide)
        );
        return firstVisibleIndex !== -1 ? firstVisibleIndex : 0; // Fallback to 0 if all slides are hidden
    }

    /**
     * Checks if a slide is visible (not display: none) unless it has "force-visible" class.
     */
    isSlideVisible(slide) {
        const computedStyle = window.getComputedStyle(slide);
        return (
            computedStyle.display !== "none" ||
            slide.classList.contains("force-visible")
        );
    }

    setupAccessibility() {
        this.sliderList.setAttribute("aria-live", "polite");
        this.sliderList.setAttribute("role", "region");
        this.sliderList.setAttribute("aria-roledescription", "carousel");

        this.slides.forEach((slide, index) => {
            slide.setAttribute("role", "group");
            slide.setAttribute("aria-roledescription", "slide");
            slide.setAttribute(
                "aria-label",
                `Slide ${index + 1} of ${this.slides.length}`
            );
            slide.classList.toggle(
                "slide--active",
                index === this.currentIndex
            );
        });
    }

    getTargetScrollLeft(slide, index) {
        if (this.config.changeWidth.enabled && this.initialSlideWidth) {
            return index * (this.initialSlideWidth + this.flexGap);
        } else {
            return slide.offsetLeft;
        }
    }

    moveToSlide(index) {
        const slide = this.slides[index];
        if (!slide || !this.isSlideVisible(slide)) {
            const nextVisibleIndex = this.findFirstVisibleSlide();
            if (nextVisibleIndex === -1) return;
            index = nextVisibleIndex;
        }

        this.cancelMomentumAnimation();

        this.slides.forEach((s, i) => {
            s.classList.toggle("slide--active", i === index);
        });

        this.currentIndex = index;
        const targetScrollLeft = this.getTargetScrollLeft(
            this.slides[index],
            index
        );
        this.smoothScrollTo(targetScrollLeft, this.config.slideSpeed);
        this.updatePagination();
    }

    determineActiveSlideNonSticky() {
        const containerRect = this.sliderList.getBoundingClientRect();
        let maxOverlap = 0;
        let activeIndex = this.currentIndex;

        this.slides.forEach((slide, index) => {
            if (!this.isSlideVisible(slide)) return;
            const slideRect = slide.getBoundingClientRect();
            const overlap =
                Math.min(containerRect.right, slideRect.right) -
                Math.max(containerRect.left, slideRect.left);

            if (overlap > maxOverlap) {
                maxOverlap = overlap;
                activeIndex = index;
            }
        });
        return activeIndex;
    }

    updateActiveSlide() {
        if (!this.config.autoActive) return;
        let newIndex = this.currentIndex;

        if (this.config.freeMode) {
            newIndex = this.determineActiveSlideNonSticky();
        } else {
            for (let i = 0; i < this.slides.length; i++) {
                if (
                    this.isSlideVisible(this.slides[i]) &&
                    this.sliderList.scrollLeft < this.slides[i].offsetLeft + 1
                ) {
                    newIndex = i;
                    break;
                }
            }
        }

        if (newIndex !== this.currentIndex) {
            this.currentIndex = newIndex;
            this.slides.forEach((s, i) => {
                s.classList.toggle("slide--active", i === newIndex);
            });
            this.updatePagination();
        }
    }

    setupSlideClick() {
        if (!this.config.clickToSlide) return;

        this.slides.forEach((slide, index) => {
            const slideHammer = new Hammer(slide);
            slideHammer.on("tap", () => {
                if (!this.isDragging && this.isSlideVisible(slide)) {
                    this.moveToSlide(index);
                }
            });
        });
    }

    setupPagination() {
        this.paginationList = document.createElement("ul");
        this.paginationList.setAttribute("role", "tablist");
        this.paginationContainer.innerHTML = "";
        this.paginationContainer.appendChild(this.paginationList);
        this.paginationDots = [];

        this.slides.forEach((_, index) => {
            if (!this.isSlideVisible(this.slides[index])) return; // Skip hidden slides

            const li = document.createElement("li");
            const dot = document.createElement("button");
            dot.classList.add("slider__dot");
            dot.dataset.index = index;
            dot.setAttribute("aria-label", `Go to slide ${index + 1}`);
            dot.setAttribute("role", "tab");
            dot.setAttribute("aria-controls", this.sliderList.id || "");

            if (index === this.currentIndex) {
                dot.classList.add("active");
                dot.setAttribute("aria-selected", "true");
            } else {
                dot.setAttribute("aria-selected", "false");
            }
            li.appendChild(dot);
            this.paginationList.appendChild(li);
            this.paginationDots.push(dot);

            dot.addEventListener("click", () => {
                this.moveToSlide(index);
            });
        });

        this.sliderList.addEventListener("scroll", () => {
            if (this.config.freeMode) {
                this.updateActiveSlide();
            } else {
                this.updatePagination();
            }
        });
    }

    updatePagination() {
        if (!this.paginationDots) return;
        this.paginationDots.forEach((dot, index) => {
            dot.classList.toggle("active", index === this.currentIndex);
            dot.setAttribute(
                "aria-selected",
                index === this.currentIndex ? "true" : "false"
            );
        });
    }

    destroy() {
        if (this.hammer) {
            this.hammer.destroy();
        }
    }
}

export default Slider;
