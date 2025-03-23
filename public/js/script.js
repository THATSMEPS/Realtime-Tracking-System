const socket = io();
const markers = {};
const userList = document.getElementById("user-list");

const userName = prompt("Enter your name:") || "Anonymous"; 
socket.emit('set-username', userName);
// Set up the map
const map = L.map("map").setView([0, 0], 16);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "The Tracker"
}).addTo(map);

let firstUpdate = true;
// Get the user's initial position and place a marker
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            map.setView([latitude, longitude], 16);
            markers["self"] = L.marker([latitude, longitude]).addTo(map)
                .bindPopup("You are here")
                .openPopup();
        },
        (error) => {
            console.error("Error getting initial location:", error);
        }
    );

    // Continuously track user's location
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            socket.emit("send-location", { latitude, longitude, name: userName });
        },
        (error) => {
            console.error("Geolocation error:", error.code, error.message);
            alert(`Error ${error.code}: ${error.message}`);
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        }
    );
}

// Handle incoming locations from other users
socket.on("receive-location", (data) => {
    const { id, name, latitude, longitude } = data;

    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]); // Update marker position
    } else {
        markers[id] = L.marker([latitude, longitude]).addTo(map).bindPopup(name); // Create marker
    }

    if (id === socket.id) {
        map.setView([latitude, longitude]);
        firstUpdate = false; // Center map for current user only
    }
    updateUserList();
});

// Remove markers when users disconnect
socket.on("user-disconnected", (id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
    }
    updateUserList();
});

function updateUserList() {
    userList.innerHTML="";//clear old lists
    Object.entries(markers).forEach(([id, marker]) => {
        if (id !== "self") {
            const userItem = document.createElement("div");
            userItem.classList.add("user")
            userItem.textContent = marker.getPopup().getContent();
            userList.appendChild(userItem);
        }
    });
}
document.addEventListener("DOMContentLoaded", () => {
    const toggleButton = document.getElementById("toggle-sidebar");
    const sidebar = document.querySelector(".sidebar");
    const map = document.getElementById("map");

    toggleButton.addEventListener("click", () => {
        sidebar.classList.toggle("collapsed");
        map.classList.toggle("expanded");
    });
});