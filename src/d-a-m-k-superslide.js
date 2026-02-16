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
            lang: "auto",
            ...config,
        };

        let lang = this.config.lang;
        if (!lang || lang === "auto") {
            lang = (document.documentElement.lang || "en").toLowerCase();
        }
        this.lang = lang.toLowerCase();
        this.isGerman = this.lang.startsWith("de");
        if (!this.isGerman) this.lang = "en";

        this.sliderList = sliderElement.querySelector(".slider__list");
        if (!this.sliderList) return;
        if (!this.sliderList.id) {
            this.sliderList.id = `slider-list-${Math.floor(
                Math.random() * 10000,
            )}`;
        }
        this.prevButton = sliderElement.querySelector(".slider--prev");
        this.nextButton = sliderElement.querySelector(".slider--next");
        this.paginationContainer = sliderElement.querySelector(
            ".slider__pagination",
        );
        this.slides = Array.from(this.sliderList.children).filter((slide) => {
            return window.getComputedStyle(slide).display !== "none";
        });

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
        this.slides.forEach((slide, index) => {
            const slideHammer = new Hammer(slide);
            slideHammer.on("tap", () => {
                if (!this.isDragging) {
                    this.moveToSlide(index);
                }
            });
        });
    }

    getTargetScrollLeft(slide, index) {
        const sliderListRect = this.sliderList.getBoundingClientRect();
        const slideRect = slide.getBoundingClientRect();
        const currentScrollLeft = this.sliderList.scrollLeft;

        const computedStyle = window.getComputedStyle(this.sliderList);
        const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;

        const delta = slideRect.left - sliderListRect.left;

        // Adjust scroll so slide's left aligns with inner left edge (after padding)
        return currentScrollLeft + delta - paddingLeft;
    }

    moveToSlide(index) {
        const slide = this.slides[index];
        if (!slide) return;

        this.cancelMomentumAnimation();
        this.slides.forEach((s, i) => {
            const isActive = i === index;
            s.classList.toggle("slide--active", isActive);
            if (!isActive) {
                s.inert = true;
            } else {
                s.inert = false;
                s.setAttribute("tabindex", "0");
            }
        });

        this.currentIndex = index;

        const event = new CustomEvent("slideChange", {
            detail: { index, slide: this.slides[index] },
        });
        this.sliderElement.dispatchEvent(event);

        const targetScrollLeft = this.config.changeWidth.enabled
            ? index * (this.initialSlideWidth + this.flexGap)
            : this.getTargetScrollLeft(slide, index);

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
            this.moveToSlide(newIndex);
        }
    }

    smoothScrollTo(targetScrollLeft, duration) {
        const start = this.sliderList.scrollLeft;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
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
        const prevLabel = this.isGerman ? "Vorherige Folie" : "Previous slide";
        const nextLabel = this.isGerman ? "Nächste Folie" : "Next slide";

        this.prevButton.setAttribute("aria-label", prevLabel);
        this.nextButton.setAttribute("aria-label", nextLabel);

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
        const dotLabelPrefix = this.isGerman ? "Zur Folie" : "Go to slide";

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
            dot.setAttribute("aria-label", `${dotLabelPrefix} ${index + 1}`);
            dot.setAttribute("role", "tab");
            dot.setAttribute("aria-controls", this.sliderList.id);
            dot.setAttribute(
                "aria-selected",
                index === this.currentIndex ? "true" : "false",
            );

            if (index === this.currentIndex) {
                dot.classList.add("active");
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
                index === this.currentIndex ? "true" : "false",
            );
        });
    }

    setupSwipe() {
        this.sliderList.style.touchAction = "pan-y";
        this.hammer = new Hammer(this.sliderList);
        this.hammer.get("pan").set({ direction: Hammer.DIRECTION_HORIZONTAL });

        let isHorizontalSwipe = null;

        this.sliderList.addEventListener(
            "touchstart",
            (e) => {
                const touch = e.touches[0];
                this.startX = touch.clientX;
                this.startY = touch.clientY;
                isHorizontalSwipe = null;
            },
            { passive: true },
        );

        this.sliderList.addEventListener(
            "touchmove",
            (e) => {
                if (isHorizontalSwipe === null) {
                    const touch = e.touches[0];
                    const deltaX = Math.abs(touch.clientX - this.startX);
                    const deltaY = Math.abs(touch.clientY - this.startY);
                    isHorizontalSwipe = deltaX > deltaY;
                }

                if (isHorizontalSwipe) {
                    e.preventDefault();
                }
            },
            { passive: false },
        );

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
