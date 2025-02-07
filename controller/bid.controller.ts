import { Response } from 'express';
import Flower from '../models/Flower';
import Bid from '../models/Bid';
import { AuthenticatedRequest } from '../middleware/authenticator';

export const placeBid = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const { flowerId } = req.params;
    const { amount } = req.body;

    const flower = await Flower.findById(flowerId);
    if (!flower) {
      res.status(404).json({ error: 'Flower not found.' });
      return;
    }
    if (new Date() > flower.bidEndTime) {
      res.status(400).json({ error: 'Bidding time has ended for this flower.' });
      return;
    }

    // Optionally, you could enforce that the new bid is higher than the current highest bid

    const bid = new Bid({
      user: userId,
      flower: flowerId,
      amount,
    });
    await bid.save();

    res.json({ message: 'Bid placed successfully.', bid });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error.' });
  }
};
