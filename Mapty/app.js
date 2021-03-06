"use strict";
const elements = {
    form: document.querySelector('.form'),
    containerWorkouts: document.querySelector('.workouts'),
    inputType: document.querySelector('.form__input--type'),
    inputDistance: document.querySelector('.form__input--distance'),
    inputDuration: document.querySelector('.form__input--duration'),
    inputCadence: document.querySelector('.form__input--cadence'),
    inputElevation: document.querySelector('.form__input--elevation'),
};
const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];
class Workout {
    constructor(coords, distance, duration) {
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
        this.id = `${Date.now()}`.slice(-10);
        this.date = new Date();
    }
}
class Running extends Workout {
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
        this.cadence = cadence;
        this.type = 'running';
        this.description = `${this.type[0].toUpperCase() + this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
        this.cadence = cadence;
        this.calcPace();
    }
    calcPace() {
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}
class Cycling extends Workout {
    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
        this.elevationGain = elevationGain;
        this.type = 'cycling';
        this.description = `${this.type[0].toUpperCase() + this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
        this.elevationGain = elevationGain;
        this.calcSpeed();
    }
    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}
class App {
    constructor() {
        this.mapZoomLevel = 12;
        this.workouts = [];
        this.getPosition();
        elements.form.addEventListener('submit', this.newWorkout.bind(this));
        this.getLocalStorage();
        elements.inputType.addEventListener('change', this.toggleElevationField);
        elements.containerWorkouts.addEventListener('click', this.moveToPopup.bind(this));
    }
    getPosition() {
        if (navigator.geolocation)
            navigator.geolocation.getCurrentPosition(this.loadMap.bind(this), () => alert('Could not get your location : ('));
    }
    loadMap(position) {
        const { latitude, longitude } = position.coords;
        this.map = L.map('map').setView([latitude, longitude], this.mapZoomLevel);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(this.map);
        this.map.on('click', this.showForm.bind(this));
        this.workouts.forEach(workout => {
            this.renderWorkoutMarker(workout);
        });
    }
    showForm(e) {
        this.mapEvent = e;
        elements.form.classList.remove('hidden');
        elements.inputDistance.focus();
    }
    hideForm() {
        elements.inputDistance.value = elements.inputCadence.value = elements.inputDuration.value = elements.inputElevation.value =
            '';
        elements.form.style.display = 'none';
        elements.form.classList.add('hidden');
        setTimeout(() => (elements.form.style.display = 'grid'), 1000);
    }
    toggleElevationField() {
        [elements.inputElevation, elements.inputCadence].forEach(input => input.closest('.form__row').classList.toggle('form__row--hidden'));
    }
    newWorkout(e) {
        e.preventDefault();
        const inputValidator = (...inputs) => inputs.every(input => input && input > 0);
        const { lat, lng } = this.mapEvent.latlng;
        const type = elements.inputType.value;
        const distance = +elements.inputDistance.value;
        const duration = +elements.inputDuration.value;
        let workout;
        if (type === 'running') {
            const cadence = +elements.inputCadence.value;
            if (!inputValidator(distance, duration) || !cadence)
                return alert('Inputs have to be positive numbers!');
            workout = new Running([lat, lng], distance, duration, cadence);
        }
        if (type === 'cycling') {
            const elevationGain = +elements.inputElevation.value;
            if (!inputValidator(distance, duration) || !elevationGain)
                return alert('Inputs have to be positive numbers!');
            workout = new Cycling([lat, lng], distance, duration, elevationGain);
        }
        this.workouts.push(workout);
        this.renderWorkoutMarker(workout);
        this.renderWorkout(workout);
        this.hideForm();
        this.setLocalStorage();
    }
    renderWorkoutMarker(workout) {
        L.marker(workout.coords)
            .addTo(this.map)
            .bindPopup(L.popup({
            maxWidth: 250,
            minWidth: 100,
            autoClose: false,
            closeOnClick: false,
            className: `${workout.type}-popup`,
        }))
            .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
            .openPopup();
    }
    renderWorkout(workout) {
        let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
    `;
        if (workout.type === 'running')
            html += `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
    `;
        else
            html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
    `;
        elements.form.insertAdjacentHTML('afterend', html);
    }
    moveToPopup(e) {
        const workoutEl = e.target.closest('.workout');
        if (!workoutEl)
            return;
        const workoutCoords = this.workouts.find(workout => workout.id === workoutEl.dataset.id)?.coords;
        this.map.setView(workoutCoords, this.mapZoomLevel, {
            animate: true,
            pan: {
                duration: 1,
            },
        });
    }
    setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.workouts));
    }
    getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'));
        if (!data)
            return;
        this.workouts = data;
        this.workouts.forEach(workout => {
            this.renderWorkout(workout);
        });
    }
    _reset() {
        localStorage.removeItem('workouts');
        location.reload();
    }
}
const app = new App();
