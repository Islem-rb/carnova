package CarNova.carnova.Service;

import CarNova.carnova.Entity.Showroom;
import CarNova.carnova.Entity.User;
import CarNova.carnova.Repository.ShowroomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ShowroomService {
    @Autowired
    private ShowroomRepository showroomRepository;

    public Showroom saveShowroom(Showroom showroom) {
        return showroomRepository.save(showroom);
    }

    public List<Showroom> getShowroomsByUser(User user) {
        return showroomRepository.findByUserId(user.getId());
    }

    public Optional<Showroom> getShowroomById(Long id) {
        return showroomRepository.findById(id);
    }

    public List<Showroom> getAllShowrooms() {
        return showroomRepository.findAll();
    }

    public void deleteShowroom(Long id) {
        showroomRepository.deleteById(id);
    }
} 