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
        this.slides = Array.from(this.sliderList.children);
        this.currentIndex = 0;
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

    setupSlideClick() {
        if (!this.config.clickToSlide) return;

        this.slides.forEach((slide, index) => {
            const slideHammer = new Hammer(slide);
            slideHammer.on("tap", () => {
                if (!this.isDragging) {
                    this.moveToSlide(index);
                }
            });
        });
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
        if (!slide) return;
        this.cancelMomentumAnimation();

        this.slides.forEach((s, i) => {
            s.classList.toggle("slide--active", i === index);
        });

        this.currentIndex = index;
        const targetScrollLeft = this.getTargetScrollLeft(slide, index);
        this.smoothScrollTo(targetScrollLeft, this.config.slideSpeed);
        this.updatePagination();
    }

    determineActiveSlideNonSticky() {
        const containerRect = this.sliderList.getBoundingClientRect();
        let maxOverlap = 0;
        let activeIndex = this.currentIndex;

        this.slides.forEach((slide, index) => {
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
                    this.sliderList.scrollLeft <
                    this.slides[i].offsetLeft + 1
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

    smoothScrollTo(targetScrollLeft, duration) {
        const start = this.sliderList.scrollLeft;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease In-Out
            const ease =
                progress < 0.5
                    ? 2 * progress * progress
                    : -1 + (4 - 2 * progress) * progress;

            this.sliderList.scrollLeft =
                start + (targetScrollLeft - start) * ease;

            if (progress < 1) {
                this.animationId = requestAnimationFrame(animate);
            } else {
                this.animationId = null;
                if (this.config.freeMode) {
                    this.updateActiveSlide();
                }
            }
        };
        this.animationId = requestAnimationFrame(animate);
    }

    setupNavigation() {
        this.prevButton.setAttribute("aria-label", "Previous slide");
        this.nextButton.setAttribute("aria-label", "Next slide");

        this.prevButton.addEventListener("click", () => {
            let newIndex = this.currentIndex - 1;
            if (this.config.isLoop && this.currentIndex === 0) {
                newIndex = this.slides.length - 1;
            } else {
                newIndex = Math.max(0, newIndex);
            }
            this.moveToSlide(newIndex);
        });

        this.nextButton.addEventListener("click", () => {
            let newIndex = this.currentIndex + 1;
            if (
                this.config.isLoop &&
                this.currentIndex === this.slides.length - 1
            ) {
                newIndex = 0;
            } else {
                newIndex = Math.min(this.slides.length - 1, newIndex);
            }
            this.moveToSlide(newIndex);
        });
    }

    setupPagination() {
        this.paginationList = document.createElement("ul");
        this.paginationList.setAttribute("role", "tablist");
        this.paginationContainer.innerHTML = "";
        this.paginationContainer.appendChild(this.paginationList);
        this.paginationDots = [];

        this.slides.forEach((_, index) => {
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

    setupSwipe() {
        this.sliderList.style.touchAction = "none";
        this.hammer = new Hammer(this.sliderList);
        this.hammer.get("pan").set({ direction: Hammer.DIRECTION_HORIZONTAL });
        this.currentX = 0;
        this.lastX = 0;
        this.velocity = 0;

        const updateVelocity = (x) => {
            this.velocity = x - this.lastX;
            this.lastX = x;
        };

        const animateMomentum = () => {
            this.sliderList.scrollLeft -= this.velocity;
            this.velocity *= 0.95;
            if (Math.abs(this.velocity) > 0.5) {
                this.animationId = requestAnimationFrame(animateMomentum);
            } else {
                this.cancelMomentumAnimation();
                if (this.config.freeMode) {
                    this.updateActiveSlide();
                }
            }
        };

        const startMomentumAnimation = () => {
            if (Math.abs(this.velocity) < 0.5) return;
            this.cancelMomentumAnimation();
            this.animationId = requestAnimationFrame(animateMomentum);
        };

        this.hammer.on("panstart", (ev) => {
            this.isDragging = true;
            this.currentX = this.sliderList.scrollLeft;
            this.lastX = ev.center.x;
            this.cancelMomentumAnimation();
        });

        this.hammer.on("panmove", (ev) => {
            if (this.config.freeMode) {
                this.sliderList.scrollLeft = this.currentX - ev.deltaX;
            }
            updateVelocity(ev.center.x);
        });

        this.hammer.on("panend", (ev) => {
            setTimeout(() => {
                this.isDragging = false;
            }, 50);

            if (!this.config.freeMode) {
                this.handleStickySwipe(ev);
            } else {
                startMomentumAnimation();
            }
        });
    }

    setupKeyboardNavigation() {
        this.sliderList.setAttribute("tabindex", "0");
        this.sliderList.addEventListener("keydown", (event) => {
            this.cancelMomentumAnimation();
            let newIndex = this.currentIndex;
            if (event.key === "ArrowRight") {
                newIndex = Math.min(this.slides.length - 1, newIndex + 1);
            } else if (event.key === "ArrowLeft") {
                newIndex = Math.max(0, newIndex - 1);
            } else {
                return;
            }
            this.moveToSlide(newIndex);
        });
    }

    setupSlideClick() {
        this.slides.forEach((slide, index) => {
            const slideHammer = new Hammer(slide);
            slideHammer.on("tap", () => {
                if (!this.isDragging) {
                    this.moveToSlide(index);
                }
            });
        });
    }

    cancelMomentumAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    handleStickySwipe(ev) {
        const maxIndex = this.slides.length - 1;
        const threshold = this.config.swipeThreshold;
        let newIndex = this.currentIndex;

        if (ev.deltaX > threshold) {
            newIndex =
                this.config.isLoop && newIndex === 0
                    ? maxIndex
                    : Math.max(0, newIndex - 1);
        } else if (ev.deltaX < -threshold) {
            newIndex =
                this.config.isLoop && newIndex === maxIndex
                    ? 0
                    : Math.min(maxIndex, newIndex + 1);
        }
        this.moveToSlide(newIndex);
    }

    destroy() {
        if (this.hammer) {
            this.hammer.destroy();
        }
    }
}

export default Slider;
