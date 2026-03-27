package com.uninode.smartcampus.modules.facilities.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.uninode.smartcampus.modules.facilities.entity.ResourceEntity;

@Repository
public interface ResourceRepository extends JpaRepository<ResourceEntity, Long> {

    @Query(value = """
            SELECT
                r.id,
                r.type,
                r.name,
                r.capacity,
                r.location
            FROM "Resource" r
            ORDER BY r.id
            """, nativeQuery = true)
    List<ResourceEntity> findAllResources();

    @Query(value = """
            SELECT
                r.id,
                r.type,
                r.name,
                r.capacity,
                r.location
            FROM "Resource" r
            WHERE LOWER(TRIM(r.type)) = LOWER(TRIM(:type))
            ORDER BY r.id
            """, nativeQuery = true)
    List<ResourceEntity> findResourcesByType(@Param("type") String type);

    @Query(value = """
            SELECT
                r.id,
                r.type,
                r.name,
                r.capacity,
                r.location
            FROM "Resource" r
            WHERE LOWER(TRIM(COALESCE(r.name, ''))) LIKE LOWER(CONCAT('%', TRIM(:name), '%'))
            ORDER BY r.id
            """, nativeQuery = true)
    List<ResourceEntity> findResourcesByName(@Param("name") String name);

    @Query(value = """
            SELECT EXISTS(
                SELECT 1
                FROM "Resource" r
                WHERE LOWER(TRIM(r.name)) = LOWER(TRIM(:name))
            )
            """, nativeQuery = true)
    boolean existsResourceByName(@Param("name") String name);

    @Query(value = """
            SELECT EXISTS(
                SELECT 1
                FROM "Resource" r
                WHERE r.id = :id
            )
            """, nativeQuery = true)
    boolean existsResourceById(@Param("id") Long id);

    @Query(value = """
            SELECT
                r.id,
                r.type,
                r.name,
                r.capacity,
                r.location
            FROM "Resource" r
            WHERE r.id = :id
            """, nativeQuery = true)
    Optional<ResourceEntity> findResourceById(@Param("id") Long id);
}
