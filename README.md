# FlowerBid :cherry_blossom:

**FlowerBid** is a real-time bidding platform where users can bid on flowers. Built with ExpressJS and MongoDB, FlowerBid provides a seamless experience for users to participate in auctions and for admins to manage the system.

## Table of Contents

- [Features](#features)
  - [For Users](#for-users)
  - [For Admins](#for-admins)
  - [General](#general)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [API Endpoints](#api-endpoints)
  - [Admin Endpoints](#admin-endpoints)
  - [User Endpoints](#user-endpoints)
  - [Authentication Endpoints](#authentication-endpoints)
- [Testing with Postman](#testing-with-postman)
- [Contributing](#contributing)
- [License](#license)

## Features

### For Users

- **Real-Time Bidding:** Place bids on flowers in real time.
- **Bid Once per Flower:** Users can bid once for a flower within a 90-second window.
- **View Flower Details:** Access comprehensive details, including name, description, starting price, and bid end time.

### For Admins

- **Flower Management:** Add, update, and delete flowers.
- **Bid Management:** View all bids placed on flowers.
- **User Management:** Block/unblock users and view system statistics.
- **Order Management:** Handle orders for delivery (e.g., cash on delivery).

### General

- **Authentication:** Secure login using JWT (JSON Web Tokens).
- **Role-Based Access Control:** Admins have exclusive access to admin-specific features.
- **Real-Time Updates:** Receive live bid updates using WebSockets (Socket.IO).

## Tech Stack

- **Backend:** Express JS, Node
- **Database:** MongoDB
- **Real-Time Communication:** WebSockets (Socket.IO)
- **Authentication:** JWT (JSON Web Tokens)
- **Testing:** Postman

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/)
- [Postman](https://www.postman.com/) (for API testing)

### Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/your-username/flowerbid.git
