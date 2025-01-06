const socket = io("http://localhost:7000");

// send examinationRequest
const sendRequestForm = document.querySelector('.sendRequest');
sendRequestForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const doctorName = document.querySelector('[name="doctorName"]').value;
    const date = document.querySelector('[name="date"]').value;
    const data = {
        doctorName: doctorName,
        date: date,
    };
    socket.emit('examinationRequest', data);
    alert('Examination request sent successfully!');
});

// listen for examinationResponse
socket.on("examinationResponse", (data) => {
    if (data.statusCode !== 200) {
        alert(data.message)
    } else {
        alert(data.message);
    }
});